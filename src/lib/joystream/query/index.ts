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
            if (this.entries[i].key == key) {
                return this.entries[i]
            }
        }
        return null
    }

    public get(key: K): V | null {
        for (let i: i32 = 0; i < this.entries.length; i++) {
            if (this.entries[i].key == key) {
                return this.entries[i].value
            }
        }
        return null
    }

    public isSet(key: K): bool {
        for (let i: i32 = 0; i < this.entries.length; i++) {
            if (this.entries[i].key == key) {
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

    export function ResolverSDLType(r: Resolver): string {
        return r.SDLType
    }

    export function NewContext(p: Params): Context {
        const c = new Context()
        c.id = changetype<u32>(c)
		c.params = p
		c.produce = new ContextualYielder(c)
        return c
    }

	export function SetContextParams(c: Context, p: Params): void {
		c.params = p
	}

    export function ResolveQuery(w: ResolverWrapper, c: Context): void {
        w.resolve(c)
    }

    export function ResolverType(w: ResolverWrapper): string {
        return w.returnType()
    }

    export function ResolverParams(w: ResolverWrapper): string[] {
        return w.params()
    }
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

export function classify<T>(input: JSON): T {
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

declare namespace console {
    @external("console", "logs")
    export function logs(val: string): void

    @external("console", "log")
    export function log<T>(val: T): void
}

declare namespace api {
    type callback<T = JSON> = (c: Context, j: T) => void
    type nestedCallback<T = JSON> = (c: Context, j: JSON, callback: callback<T>) => void

    @external("api", "call")
    function call(ctx: Context,
                  module: string,
                  storage: string,
                  callback: callback): JSON

    @external("api", "callWithArgNumber")
    function callArg<T>(ctx: Context,
                        module: string,
                        storage: string,
                        arg: T, callback: callback): JSON

    @external("api", "callWrapper")
    function callWrapper<T>(ctx: Context,
                            module: string,
                            storage: string,
                            callback0: nestedCallback<T>,
                            callback1: callback<T>): JSON

    @external("api", "callWithArgNumberWrapper")
    function callArgWrapper<T, K>(ctx: Context,
                                  module: string,
                                  storage: string,
                                  arg: K,
                                  callback0: nestedCallback<T>,
                                  callback1: callback<T> ): JSON

    @external("api", "callWithArgNumberWrapperBatch")
    function callArgWrapperBatch<T, K>(ctx: Context,
                                       module: string,
                                       storage: string,
                                       arg: K[],
                                       callback0: nestedCallback<T>,
                                       callback1: callback<T> ): JSON

}

declare namespace response {
    @external("response", "pushString")
    function pushString(ctx: Context, value: string): void

    @external("response", "stringField")
    function stringField(ctx: Context, key: string, value: string): void

    @external("response", "numberField")
    function numberField(ctx: Context, key: string, value: u32): void

    @external("response", "pushObject")
    function pushObject(ctx: Context): void

    @external("response", "popObject")
    function popObject(ctx: Context): void
}

export class ContextualYielder {
	context: Context
	//filters: Array<FilterFunc>
	
	constructor(context: Context) {
		this.context = context
        //this.filters = new Array<FilterFunc>(0)
	}

    field(entry: TypedMap<string, JSON>, name: string): void {
        const record = entry.get(name)

        switch (record.kind) {
            case JSONValueKind.NUMBER:
                response.numberField(this.context, name, record.toNumber())
                break

            case JSONValueKind.STRING:
                response.stringField(this.context, name, record.toString())
                break
        }
    }

    json(j: JSON): void {
        // FIXME! Handle non-objects
        const record = j.toObject()
        const keys = record.keys()

        response.pushObject(this.context)
        for (let i: i32 = 0; i < keys.length; i++) {
            this.field(record, keys[i])
        }
        response.popObject(this.context)
    }
}

export { console, api, response }

export type Params = TypedMap<string, JSON>
export type ResolverFunc = (ctx: Context) => void
export type StringFunc = () => string
export type StringArrayFunc = () => string[]

export class Context {
    id: u32
    params: Params
    ptr: u32
	produce: ContextualYielder

    as<T>(): T {
        return changetype<T>(this.ptr)
    }

	param<T>(name: string): T {
		const value = this.params.get(name)
        assert(value !== null, "Unexpected null param.")
		return classify<T>(value as JSON)
	}
}

export class Resolver {
    public params: string[]
    public SDLType: string

    constructor(params: string[], SDLType: string) {
        this.params = params
        this.SDLType = SDLType
    }

    public resolve(ctx: Context): void {}
}

export enum FilterMode {
	Include = 1,
	Exclude = 2
}

export class Filter<T> {
	fieldAddress: string
	value: T
	mode: FilterMode

	constructor(fieldAddress: string, value: T, mode:FilterMode = FilterMode.Include) {
		this.fieldAddress = fieldAddress
		this.value = value
		this.mode = mode
	}

	filter(ctx: Context, raw: JSON): FilterMode {
		// FIXME: We're assuming JSON is an object here
		const j = raw.toObject()

		// TODO: Complex addresses: x.y.z
		if (!j.isSet(this.fieldAddress)) {
			return FilterMode.Exclude
		}

		const field = j.get(this.fieldAddress) as T
		const value:T = classify<T>(field as JSON)

		if (value == this.value) {
			return this.mode
		}

		return FilterMode.Exclude
	}

	apply(ctx: Context, j: JSON): void {
		const result = this.filter(ctx,j)
		if (result == FilterMode.Include) {
			ctx.produce.json(j)
		}
	}
}

export class FieldFilter<T> {
	fieldName: string

	constructor(fieldName: string) {
		this.fieldName = fieldName
	}

	apply(ctx: Context, value: T, j: JSON,  mode:FilterMode = FilterMode.Include): void {
		const f = new Filter<T>(this.fieldName, value,  mode) 
		f.apply(ctx, j)
	}
}

// ResolverWrapper uses some gymnastics to get around the lack of interfaces.
// Instead of accepting a generic type, it accepts callback functions that
// simulate getting the values from a generic type.
export class ResolverWrapper {
    public resolveFunc: ResolverFunc
    public returnTypeFunc: StringFunc
    public filtersFunc: StringArrayFunc

    constructor(resolveFn: ResolverFunc, returnFn: StringFunc, filtersFn: StringArrayFunc) {
        this.resolveFunc = resolveFn
        this.returnTypeFunc = returnFn
        this.filtersFunc = filtersFn
    }

    // TODO! Add return type and params callbacks!
    public resolve(ctx: Context): void {
        this.resolveFunc(ctx)
    }

    public returnType(): string {
        return this.returnTypeFunc()
    }

    public params(): string[] {
        return this.filtersFunc()
    }
}

export function DeclareResolver<T extends Resolver>(): ResolverWrapper  {
    return new ResolverWrapper(
        (ctx: Context) => {
            const obj = instantiate<T>()
            ctx.ptr = changetype<u32>(obj)
            obj.resolve(ctx)
        },
        (): string => {
            const obj = instantiate<T>()
            return obj.SDLType
        },
        (): string[] => {
            const obj = instantiate<T>()
            return obj.params
        },
    )
}
