import { SnowflakeJSPrimitive } from './../snowflake-core';
import { Stream } from 'ts-stream';


export interface ColumnDefinition<T> {
    name: string
    fromSnowflake: (obj: SnowflakeJSPrimitive) => T
    toSnowflake: (t: T) => SnowflakeJSPrimitive
}

export type QueryOf<T>  = {
    [P in keyof T]: ColumnDefinition<T[P]>
}

const ColumnDefinition = {
    number: (name: string) => ({
        name,
        fromSnowflake: (obj: SnowflakeJSPrimitive) => parseInt(obj!.toString()),
        toSnowflake: (t: number) => t
    }) as ColumnDefinition<number>,
    string: (name: string) => ({
        name,
        fromSnowflake: (obj: SnowflakeJSPrimitive) => obj!.toString(),
        toSnowflake: (t: string) => t
    }) as ColumnDefinition<string>,

}

export const doQuery: <T>(queryOf: QueryOf<T>) => Stream<T> = q => { throw Error("Not Implemented") }

// Usage..


const person = doQuery({
    id: ColumnDefinition.string("ID"),
    name: ColumnDefinition.string("NAME"),
    dob: ColumnDefinition.number("DOB_TS")
})

person.map(p =>  
    // strongly typed goodness available here
    )