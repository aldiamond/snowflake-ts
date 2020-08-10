import { ReadableStream, Stream } from 'ts-stream';
import { SnowflakeObject, Constructor, Mapper } from './mapping/mapper';
import { SqlCommand, CompleteCallback, ConnectionOptions, SnowflakeConnection } from './snowflake-core';
import * as snowflake from 'snowflake-sdk'
import { Query } from './queries';
import { SqlGenerator } from "./sql-generator";
import './stream-extensions'
import './promise-extensions'

export interface Logger {
    info(msg: string): void
    error(msg: string): void
    log(msg: string): void
    warn(msg: string): void
}

export class SnowflakeClient {
    private readonly conn: SnowflakeConnection;
    private readonly logger: Logger;

    constructor(connection: SnowflakeConnection, logger: Logger) {
        this.conn = connection;
        this.logger = logger;
    }

    public static createConnection(opts: ConnectionOptions, logger: Logger = console): Promise<SnowflakeClient> {
        return new Promise((resolve, reject) => snowflake
            .createConnection(opts)
            .connect((err, conn) => err ? reject(err) : resolve(new SnowflakeClient(conn, logger)))
        );
    }

    public execute(args: SqlCommand | string): Promise<void> {
        return new Promise((resolve, reject) => {
            const complete: CompleteCallback = (err, _, __) => err ? reject(err) : resolve();
            const command: SqlCommand = (args as SqlCommand).sqlText ? args as SqlCommand : { sqlText: args as string }
            return this.conn.execute(Object.assign({}, command, { complete }));
        });
    }

    public write<T>(table: Constructor<T>, items: Array<SnowflakeObject<T>>): Promise<void> {
        return this.writeStream(table, Stream.from(items), items.length);
    }

    public writeStream<T>(table: Constructor<T>, stream: ReadableStream<SnowflakeObject<T>>, batchSize: number): Promise<void> {
        const schema = Mapper.getSchema(table);

        return stream.chunk(batchSize).forEach(chunk => {
            const sql = SqlGenerator.generateBatchInsert(schema.name, chunk.map(r => Mapper.toRow(table, r)));
            return this.execute(sql);
        });
    }


    public sink<T>(table: Constructor<T>, batchSize: number): (stream: ReadableStream<SnowflakeObject<T>>) => Promise<void> {
        return s => this.writeStream(table, s, batchSize);
    }


    public readStreamOf<T>(table: Constructor<T>, query?: Query<T>): ReadableStream<T> {
        const schema = Mapper.getSchema(table);
        const sql = SqlGenerator.generateSelect(schema, query);
        return this.readStream(table, sql);
    }


    public readStream<T>(table: Constructor<T>, sql: SqlCommand | string): ReadableStream<T> {
        const query: SqlCommand = (sql as SqlCommand).sqlText ? (sql as SqlCommand) : { sqlText: sql as string };
        return this.readStreamRaw(query).map(r => Mapper.fromRow(table, r));
    }


    public readStreamRaw(sql: SqlCommand | string): ReadableStream<any> {
        const query: SqlCommand = (sql as SqlCommand).sqlText ? (sql as SqlCommand) : { sqlText: sql as string };
        const stream = new Stream<any>();
        const snowflakeStream = this.conn.execute(query).streamRows();
        snowflakeStream.on("data", d => {
            stream.write(d);
        });
        snowflakeStream.on("error", (e) => {
            console.error(`Error in snowflake stream ${e}`);
            stream.end(Error(e.message));
        });
        snowflakeStream.on("end", () => stream.end());
        return stream as unknown as ReadableStream<any>;
    }
}
