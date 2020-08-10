
import {Stream, Transform, Readable, Writable, ReadableStream } from 'ts-stream'

type Chunker = <T>(size: number) => Transform<T, Array<T>>

const chunker: Chunker = <T>(size: number) => (r: Readable<T>, w: Writable<Array<T>>) => {
    var buffer: T[] = new Array<T>()
    r.result().then(_ => {
        if (buffer.length > 0) {
            w.write(buffer)
        }

        w.end()
    })
    r.forEach(s => {
        buffer.push(s)
        if (buffer.length === size) {
            w.write(buffer)
            buffer = []
        }
    })
}

export type Sink<T> = (s: ReadableStream<T>) => Promise<void>

declare module './stream' {
    interface Stream<T> {
        chunk(size: number): ReadableStream<Array<T>>
        sink(sink: Sink<T>): Promise<void>
    }
    interface ReadableStream<T> {
        chunk(size: number): ReadableStream<Array<T>>
        sink(sink: Sink<T>): Promise<void>
    }
}

// Hack
Stream.prototype.chunk = function (size: number) {
    return this.transform(chunker(size))
}

Stream.prototype.sink = function(sink) {
    return sink(this)
}
