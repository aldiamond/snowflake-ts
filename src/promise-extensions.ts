
interface Promise<T> {
    as<T, B>(b: B): Promise<B>
    tap<T>(f: (t: T) => void): Promise<T>;
    flatTap<T>(f: (t: T) => Promise<void>): Promise<T>;
    tapError<T>(e: (e: any) => void): Promise<T>
    flatTapError<T>(e: (e: any) => Promise<void>): Promise<T>
}


Promise.prototype.as = function (b: any) {
    return this.then(_ => b)
}

Promise.prototype.flatTap = function (cb: Function) {
    return this.then(o => cb(o).as(o))
}

Promise.prototype.flatTapError = function (cb: Function) {
    return this.catch(e => cb(e).then((_: any) => { throw e }))
}

Promise.prototype.tap = function (cb: Function) {
    return this.then(t => { cb(t); return t })
}

Promise.prototype.tap = function (cb: Function) {
    return this.then(t => { cb(t); return t })
}