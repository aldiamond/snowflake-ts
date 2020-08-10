import { SnowflakeObject } from './mapping/mapper';
import { SnowflakeJSPrimitive } from './snowflake-core';
import './promise-extensions'
import './stream-extensions'


export type Operator = "<" | "<=" | "==" | ">=" | ">"
export type Comparison<T extends SnowflakeJSPrimitive> = { operand: T, operator: Operator }
export type Query<T> = { [P in keyof T]: Comparison<SnowflakeObject<T>[P]> | SnowflakeJSPrimitive }


