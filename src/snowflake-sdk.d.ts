import { ConnectionOptions, SnowflakeConnection } from "./snowflake-core";

declare module 'snowflake-sdk' {

    export function configure(options: ConnectionOptions): void;

    export function createConnection(options: ConnectionOptions): SnowflakeConnection;

    export function deserializeConnection(options: any, serializedConnection: any): any;

    export function serializeConnection(connection: any): any;

}