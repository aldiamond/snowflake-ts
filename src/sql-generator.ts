import { TableDefinition, SnowflakeObject } from './mapping/mapper';
import { SnowflakeJSPrimitive, SqlCommand } from 'snowflake-core';
import { Comparison, Query } from './queries';

export class SqlGenerator {

    private static isOperand<T extends SnowflakeJSPrimitive>(op: Comparison<T> | SnowflakeJSPrimitive): op is Comparison<T> {
        return !!(<Comparison<any>>op).operand;
    }

    static generateWhereClause<T>(query: Query<T>, mappings: Record<string, string>): SqlCommand {
        const keys = Object
            .keys(query) as Array<keyof Query<T>>;

        return keys.reduce((p, n) => {
            const queryValue = query[n];
            if (this.isOperand(queryValue)) {
                const sql = ` and ${mappings[n.toString()]} ${queryValue.operator} ?`;
                p.binds.push(queryValue.operand);
                p.sqlText += sql;
                return p;
            }
            else {
                return {
                    sqlText: p.sqlText + ` and ${mappings[n.toString()]} == ?`,
                    binds: p.binds.concat([queryValue as SnowflakeJSPrimitive])
                };
            }
        }, { sqlText: "where 1 == 1", binds: [] } as Required<SqlCommand>);
    }


    static generateSelect<T = any>(table: TableDefinition, query?: Query<T>) {
        const where: SqlCommand = query ? this.generateWhereClause(query, table.propertyToColumnMappings) : { sqlText: "", binds: [] };
        return {
            sqlText: `select ${table.columnNames.join(", ")} from ${table.name} ${where.sqlText}`.trim(),
            binds: where.binds
        };
    }


    static generateBatchInsert(tableName: string, rows: Array<SnowflakeObject>): SqlCommand {
        const keys = Object.keys(rows[0]);
        const columns = keys.join(", ");
        const values = rows.map(row => keys.map(m => row[m]));
        return {
            sqlText: `insert into ${tableName} (${columns}) values (${keys.map(_ => "?").join(", ")})`,
            binds: values
        };
    }
}
