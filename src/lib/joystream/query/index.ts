/* tslint:disable:max-classes-per-file no-namespace */

export enum JSONValueKind {
    NULL = 0,
        BOOL = 1,
        NUMBER = 2,
        STRING = 3,
        ARRAY = 4,
        OBJECT = 5,
}

export type JSONValue = u32

export class TypedMapEntry<K, V> {
    public key: K
    public value: V

    constructor(key: K, value: V) {
        this.key = key
        this.value = value
    }
}

/** Typed map */
export class TypedMap<K, V> {
    public entries: Array<TypedMapEntry<K, V>>

    constructor() {
        this.entries = new Array<TypedMapEntry<K, V>>(0)
    }

    public set(key: K, value: V): void {
        const entry = this.getEntry(key)
        if (entry !== null) {
            entry.value = value
        } else {
            const tentry = new TypedMapEntry<K, V>(key, value)
            this.entries.push(tentry)
        }
    }

    public getEntry(key: K): TypedMapEntry<K, V> | null {
        for (let i: i32 = 0; i < this.entries.length; i++) {
            if (this.entries[i].key === key) {
                return this.entries[i]
            }
        }
        return null
    }

    public get(key: K): V | null {
        for (let i: i32 = 0; i < this.entries.length; i++) {
            if (this.entries[i].key === key) {
                return this.entries[i].value
            }
        }
        return null
    }

    public isSet(key: K): bool {
        for (let i: i32 = 0; i < this.entries.length; i++) {
            if (this.entries[i].key === key) {
                return true
            }
        }
        return false
    }

    public keys(): K[] {
        const output = new Array<K>(0)
        for (let i: i32 = 0; i < this.entries.length; i++) {
            output.push(this.entries[i].key)
        }
        return output
    }
}

export namespace glue {
    export function NewStringJsonMap(): TypedMap<string, JSON> {
        return new TypedMap<string, JSON>()
    }

    export function SetTypedMapEntry(map: TypedMap<string, JSON>, key: string, value: JSON): void {
        map.set(key, value)
    }

    export function NewJson(kind: JSONValueKind, value: JSONValue): JSON {
        return new JSON(kind, value)
    }

    export const ID_STRINGJSONMAP = idof<TypedMapEntry<string, JSON>>()
    export const SIZE_STRINGJSONMAP = offsetof<TypedMapEntry<string, JSON>>()
    export const ID_ARRAYSTRINGJSONMAP = idof<Array<TypedMapEntry<string, JSON>>>()
}

export class JSON {
    public kind: JSONValueKind
    public value: JSONValue

    public constructor(kind: JSONValueKind, value: JSONValue) {
        this.kind = kind
        this.value = value
    }

    public kindString(): string {
        switch (this.kind) {
            case JSONValueKind.NULL:
                return "null"

            case JSONValueKind.BOOL:
                return "bool"

            case JSONValueKind.NUMBER:
                return "number"

            case JSONValueKind.STRING:
                return "string"

            case JSONValueKind.ARRAY:
                return "array"

            case JSONValueKind.OBJECT:
                return "object"
        }

        return "Unknown"
    }

    public toU32(): u32 {
        assert(this.kind === JSONValueKind.NUMBER, "JSON value is not a number.")
        return this.value
    }

    public toI32(): i32 {
        assert(this.kind === JSONValueKind.NUMBER, "JSON value is not a number.")
        return this.value as i32
    }

    public toNumber(): i32 {
        return this.toI32()
    }

    public toObject(): TypedMap<string, JSON> {
        assert(this.kind === JSONValueKind.OBJECT, "JSON value is not an object.")
        return changetype<TypedMap<string, JSON>>(this.value)
    }

    public toString(): string {
        assert(this.kind === JSONValueKind.STRING, "JSON value is not a string.")
        return changetype<string>(this.value as u32)
    }
}

declare namespace console {
    @external("console", "logs")
    export function logs(val: string): void

    @external("console", "log")
    export function log<T>(val: T): void
}

declare namespace api {
    type callback<T = JSON> = (j: T) => void
    type nestedCallback<T = JSON> = (j: JSON, callback: callback<T>) => void

    @external("api", "call")
    function call(module: string,
                  storage: string,
                  callback: callback): JSON

    @external("api", "callWithArgNumber")
    function callArg<T>(module: string,
                        storage: string,
                        arg: T, callback: callback): JSON

    @external("api", "callWrapper")
    function callWrapper<T>(module: string,
                            storage: string,
                            callback0: nestedCallback<T>,
                            callback1: callback<T>): JSON

    @external("api", "callWithArgNumberWrapper")
    function callArgWrapper<T, K>(module: string,
                                  storage: string,
                                  arg: K,
                                  callback0: nestedCallback<T>,
                                  callback1: callback<T> ): JSON
}

declare namespace response {
    @external("response", "pushString")
    function pushString(value: string): void

    @external("response", "stringField")
    function stringField(key: string, value: string): void

    @external("response", "numberField")
    function numberField(key: string, value: u32): void

    @external("response", "pushObject")
    function pushObject(): void

    @external("response", "popObject")
    function popObject(): void
}

export namespace produce {
    export function field(entry: TypedMap<string, JSON>, name: string): void {
        const record = entry.get(name)

        switch (record.kind) {
            case JSONValueKind.NUMBER:
                response.numberField(name, record.toNumber())
                break

            case JSONValueKind.STRING:
                response.stringField(name, record.toString())
                break
        }
    }

    export function json(j: JSON): void {
        // FIXME! Handle non-objects
        const record = j.toObject()
        const keys = record.keys()

        response.pushObject()
        for (let i: i32 = 0; i < keys.length; i++) {
            produce.field(record, keys[i])
        }
        response.popObject()
    }
}

export { console, api, response }
