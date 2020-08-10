import { SnowflakeConnection, SnowflakeStatement, ExecuteArgs } from 'snowflake-core';
import { SnowflakeClient } from "./snowflake-client";
import { Column, Table } from './mapping/attributes';
import { ObjectReadableMock } from 'stream-mock';
import './stream-extensions'

const sleep = (i: number) => new Promise((resolve, reject) => setTimeout(() => { resolve() }, i))

class MockSnowflakeConnection<T> implements SnowflakeConnection {
    private readonly returnedValues: T[];
    executeArgs: ExecuteArgs[] = []
    constructor(returnedValues: Array<T>) {
        this.returnedValues = returnedValues
    }
    connect(cb: (err: any, s: SnowflakeConnection) => void) {
        return cb(undefined, this)
    }
    execute(args: ExecuteArgs): SnowflakeStatement {
        this.executeArgs.push(args)
        const stmt = {
            streamRows: () => {
                return new ObjectReadableMock(this.returnedValues)
            },
            getNumRows: () => 1,
            cancel: () => { }
        }
        setTimeout(() => args.complete && args.complete(null, stmt, this.returnedValues), 10)
        return stmt
    }
}

@Table("read-table")
class ReadTable {
    @Column("ID")
    id: number = 1

    @Column("Name")
    name?: string

    @Column("DOB")
    dob?: Date
}

@Table("write-table")
class WriteTable {
    @Column("ReadId")
    id: number = 1

    @Column("Name")
    name?: string

    @Column("DOB")
    age?: number
}

describe("SnowflakeConnection", () => {

    const retVals = [...Array(20).keys()].map(i => ({
        ID: i,
        NAME: `Fred ${i}`,
        DOB: new Date(2000, 1, i)
    }))
    const mockConnect = new MockSnowflakeConnection(retVals)

    beforeEach(() => {
        mockConnect.executeArgs = []
    })
    it("Should read data from Snowflake with a basic equals predicate", async () => {

        const sut = new SnowflakeClient(mockConnect, console)
        await sut
            .readStreamOf(ReadTable, { id: 42 })
            .map(r => ({
                id: r.id,
                name: r.name,
                age: (new Date().getFullYear() - r.dob!.getFullYear())
            }))
            .sink(sut.sink(WriteTable, 500))

        const readQuery = mockConnect.executeArgs[0]
        const writeCommand = mockConnect.executeArgs[1]

        expect(readQuery).toEqual({
            sqlText: "select ID, NAME, DOB from read-table where 1 == 1 and ID == ?",
            binds: [42]
        })
        expect(writeCommand).toMatchObject({
            sqlText: "insert into write-table (READID, NAME, DOB) values (?, ?, ?)",
            binds: retVals.map(r => [
                r.ID,
                r.NAME,
                (new Date().getFullYear() - r.DOB!.getFullYear())
            ])
        })
    })
    it("Should read data from Snowflake with a greater than predicate", async () => {

        const sut = new SnowflakeClient(mockConnect, console)
        const resultStream = sut.readStreamOf(ReadTable, { id: { operand: 42, operator: ">" } })


        const actualResults: Array<ReadTable> = []
        await resultStream.forEach(r => { actualResults.push(r) })

        expect(actualResults.length).toBe(20)
        expect(actualResults[0]).toEqual({
            id: 0,
            name: "Fred 0",
            dob: new Date(2000, 1, 0)
        })
        expect(mockConnect.executeArgs[0]).toEqual({
            sqlText: "select ID, NAME, DOB from read-table where 1 == 1 and ID > ?",
            binds: [42]
        })

    })

})