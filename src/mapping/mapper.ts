import { SnowflakeJSPrimitive } from '../snowflake-core';
import { SchemaStore } from './attributes';
import { plainToClass } from 'class-transformer'
import "reflect-metadata";

export type Constructor<T> = new (...args: any[]) => T

export type SnowflakeObject<T = any> = {
    [P in keyof T]: SnowflakeJSPrimitive
}

export interface TableDefinition {
    name: string
    columnNames: Array<string>,
    propertyToColumnMappings: { [key: string]: string }
}

export const Mapper = {
    getSchema<T>(ctr: Constructor<T>): TableDefinition {
        const schema = SchemaStore.getSchema(ctr)
        return {
            name: schema.table,
            columnNames: Object.values(schema.mappings),
            propertyToColumnMappings: schema.mappings
        }
    },
    fromRow<T>(ctr: Constructor<T>, row: Record<string, any>): T {
        const schema = SchemaStore.getSchema(ctr)
        const switchMap: Record<string, string> = Object.keys(schema.mappings)
            .reduce((p, n) => Object.assign({}, p, { [schema.mappings[n]]: n }), {})
        const mapped = Object.keys(switchMap).reduce((p, n) => Object.assign({}, p, { [switchMap[n]]: row[n] }), {})
        return plainToClass(ctr, mapped)
    },
    toRow<T>(ctr: Constructor<T>, object: SnowflakeObject<T>): SnowflakeObject {
        const schema = SchemaStore.getSchema(ctr)
        const keys= <(keyof T)[]><unknown>Object.keys(schema.mappings)
        return keys.reduce((p,k) => Object.assign({}, p, {[schema.mappings[k.toString()]]: object[k]} ), {} as SnowflakeObject<T>)
    }
}