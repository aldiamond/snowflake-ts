/*
* Integration tests
* @group integration
*/

import { SnowflakeClient } from './snowflake-client';
import { Table, Column } from './mapping/attributes';
import { Stream } from './stream'
import 'jest-extended'

@Table("people")
class Person {

    @Column("id")
    id?: number

    @Column("name")
    name?: string

    @Column("dob")
    dob?: Date
}

describe("Integration", () => {

    beforeAll(() => jest.setTimeout(15000))
    it("Should move data around", async () => {

        const client = await SnowflakeClient.createConnection({
            username: process.env["SNOWFLAKE_USERNAME"] as string,
            password: process.env["SNOWFLAKE_PASSWORD"] as string,
            account: process.env["SNOWFLAKE_ACCOUNT"] as string,
            database: "test",
            schema: "raw"
        })

        await client.execute(`
CREATE TABLE IF NOT EXISTS
people(id INT, name STRING, dob TIMESTAMP)`)

        const toInsert = [...Array(20).keys()]
            .map(i => ({
                id: i,
                name: `Fred ${i}`,
                dob: new Date(2000, 1, i)
            }))
    

        await Stream
            .from(toInsert)
            .sink(client.sink(Person, 50))
            .then(_ => client.readStreamOf(Person))
            .then(peepsInDb => peepsInDb.toArray())
            .then(peeps => expect(peeps).toIncludeAllMembers(toInsert))
            .then(_ => client.execute("delete from people"))

    })
})