/* tslint:disable:max-classes-per-file no-namespace */

import { api, JSON } from ".."

function classify<T>(input: JSON): T {
    if (isInteger<T>()) {
        return input.toNumber()
    } else if (isSigned<T>()) {
        return input.toI32()
    } else if (isString<T>()) {
        return input.toString()
    } else {
        // Assume an object
        return instantiate<T>(input)
    }
}

export class Plain<T> {
    public module: string
    public address: string

    constructor(module: string, address: string) {
        this.module = module
        this.address = address
    }

    public fetch( fn: (v: T) => void ): void {
        api.callWrapper<T>(this.module, this.address, (j: JSON, fn1: api.callback<T>) => {
            fn1(classify<T>(j))
        }, fn)
    }
}

export class Map<K, T> extends Plain<T> {
    public fetch( index: K, fn: (v: T) => void ): void {
        api.callArgWrapper<T, K>(this.module, this.address, index, (j: JSON, fn1: api.callback<T>) => {
            fn1(classify<T>(j))
        }, fn)
    }

    public batch(): Batch<K, T> {
        return new Batch<K, T>(this)
    }
}

// Batch API requests
export class Batch<K, T> {
    public keys: K[]
    protected storage: Map<K, T>

    constructor(storage: Map<K, T>) {
        this.keys = new Array<K>(0)
        this.storage = storage
    }

    public add(key: K): void {
        this.keys.push(key)
    }

    public fetch(fn: (v: T) => void): void {
        api.callArgWrapperBatch<T, K>(
            this.storage.module,
            this.storage.address,
            this.keys,
            (j: JSON, fn1: api.callback<T>) => {
                fn1(classify<T>(j))
            }, fn)
    }
}
