import { Stream } from './stream'
import './stream-extensions'

describe("Stream", () => {
    describe("chunk", () => {
        it("Should chunk", async () => {
            const stream = Stream.from([1, 2, 3, 4, 5]).chunk(2)
            const results: Array<Array<number>> = []
            await stream.forEach(chunk => { results.push(chunk); })
            expect(results).toEqual([[1, 2], [3, 4], [5]])
        })
        it("Should chunk when chunk size is larger than stream", async () => {
            const stream = Stream.from([1, 2, 3, 4, 5]).chunk(27)
            const results: Array<Array<number>> = []
            await stream.forEach(chunk => { results.push(chunk); })
            expect(results).toEqual([[1, 2, 3, 4, 5]])
        })
    })
})