import { Table, Column } from './attributes';
import { Mapper } from './mapper';
import { SqlGenerator } from "../sql-generator";

describe("Mapper", () => {
    describe("Generate SQL", () => {
        it("Select Stmt", () => {
            @Table("test-table")
            class TestTable {
                @Column("Id")
                id?: string
                @Column("Name")
                name?: string
            }
            const sql = SqlGenerator.generateSelect(Mapper.getSchema(TestTable))
            expect(sql.sqlText).toEqual("select ID, NAME from test-table")
        })
        it("Insert Stmt", () => {
            @Table("test-table")
            class TestTable {
                @Column("Id")
                id: number = 123
                @Column("Name")
                name?: string = ""
                @Column("DOB")
                dob?: Date = new Date(2000, 1, 1)
            }
            const insertMe = new TestTable();
            insertMe.name = "Fred"
            const sql = SqlGenerator.generateBatchInsert(Mapper.getSchema(TestTable).name, [Mapper.toRow(TestTable, insertMe)])
            expect(sql.sqlText).toEqual("insert into test-table (ID, NAME, DOB) values (?, ?, ?)")
            expect(sql.binds).toEqual([[123, 'Fred', new Date(2000, 1, 1)]])
        })
    })
    describe("fromRow", () => {
        it("Should map a Snowflake row to a Class", () => {
            @Table("test-table")
            class TestTable {
                @Column("Id")
                id: number = 123
                @Column("Name")
                name?: string
                @Column("DOB")
                dob?: Date = new Date(2000, 1, 1)
            }
            const snowflakeRow = {
                ID: 456,
                NAME: "Mappy McMapper",
                DOB: new Date(2000, 1, 1)
            }
            const mapped = Mapper.fromRow(TestTable, snowflakeRow)
            expect(mapped.id).toEqual(snowflakeRow.ID)
            expect(mapped.name).toEqual(snowflakeRow.NAME)
            expect(mapped.dob).toEqual(snowflakeRow.DOB)
        })
    })
    describe("toRow", () => {
        it("Should map an instance of a class to a Snowflake row", () => {
            @Table("test-table")
            class TestTable {
                @Column("Id")
                id: number = 123
                @Column("Name")
                name?: string
                @Column("DOB")
                dob?: Date = new Date(2000, 1, 1)
            }
            const testObject = new TestTable();
            testObject.name = "Fred"
            const mapped = Mapper.toRow(TestTable, testObject)
            expect(mapped).toEqual({
                ID: 123,
                NAME: "Fred",
                DOB: new Date(2000, 1, 1)
            })
        })
    })
})