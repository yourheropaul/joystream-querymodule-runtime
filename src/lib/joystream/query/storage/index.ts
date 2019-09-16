/* tslint:disable:max-classes-per-file no-namespace */

import { api, classify, Context, JSON } from ".."

export class Plain<T> {
    public module: string
    public address: string

    constructor(module: string, address: string) {
        this.module = module
        this.address = address
    }

    public fetch(ctx: Context, fn: (ctx: Context, v: T) => void ): void {
        api.callWrapper<T>(ctx,
                           this.module, 
                           this.address, 
                           (ctx: Context, j: JSON, fn1: api.callback<T>) => {
                                fn1(ctx, classify<T>(j))
                           }, 
                           fn)
    }
}

export class Map<K, T> extends Plain<T> {
    public fetch( ctx: Context, index: K, fn: (ctx: Context, v: T) => void ): void {
        api.callArgWrapper<T, K>(ctx,
                                 this.module, 
                                 this.address, 
                                 index, 
                                 (ctx: Context, j: JSON, fn1: api.callback<T>) => {
                                    fn1(ctx, classify<T>(j))
                                 }, 
                                 fn)
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

    public fetch(ctx: Context, fn: (ctx: Context, v: T) => void): void {
        api.callArgWrapperBatch<T, K>(
            ctx,
            this.storage.module,
            this.storage.address,
            this.keys,
            (ctx: Context, j: JSON, fn1: api.callback<T>) => {
                fn1(ctx, classify<T>(j))
            }, 
            fn)
    }
}
