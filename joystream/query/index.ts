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
  key: K
  value: V

  constructor(key: K, value: V) {
    this.key = key
    this.value = value
  }
}

/** Typed map */
export class TypedMap<K, V> {
  entries: Array<TypedMapEntry<K, V>>

  constructor() {
    this.entries = new Array<TypedMapEntry<K, V>>(0)
  }

  set(key: K, value: V): void {
    let entry = this.getEntry(key)
    if (entry !== null) {
      entry.value = value
    } else {
      let entry = new TypedMapEntry<K, V>(key, value)
      this.entries.push(entry)
    }
  }

  getEntry(key: K): TypedMapEntry<K, V> | null {
    for (let i: i32 = 0; i < this.entries.length; i++) {
      if (this.entries[i].key == key) {
        return this.entries[i]
      }
    }
    return null
  }

  get(key: K): V | null {
    for (let i: i32 = 0; i < this.entries.length; i++) {
      if (this.entries[i].key == key) {
        return this.entries[i].value
      }
    }
    return null
  }

  isSet(key: K): bool {
    for (let i: i32 = 0; i < this.entries.length; i++) {
      if (this.entries[i].key == key) {
        return true
      }
    }
    return false
  }
  
  keys(): Array<K> {
	  const output = new Array<K>(0)
      for (let i: i32 = 0; i < this.entries.length; i++) {
		  output.push(this.entries[i].key)
	  }
	  return output
  }
}

export namespace glue {
	export function NewStringJsonMap(): TypedMap<string,JSON> {
		return new TypedMap<string,JSON>()
	}

	export function SetTypedMapEntry(map: TypedMap<string,JSON>, key:string, value:JSON): void {
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
    kind: JSONValueKind
    value: JSONValue

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

    toU32(): u32 {
        assert(this.kind == JSONValueKind.NUMBER, 'JSON value is not a number.')
        return this.value
    }

    toI32(): i32 {
        assert(this.kind == JSONValueKind.NUMBER, 'JSON value is not a number.')
        return this.value as i32
    }

    toNumber(): i32 {
        return this.toI32()
    }

    toObject(): TypedMap<string, JSON> {
        assert(this.kind == JSONValueKind.OBJECT, 'JSON value is not an object.')
        return changetype<TypedMap<string, JSON>>(this.value)
    }

	toString(): string {
		assert(this.kind == JSONValueKind.STRING, 'JSON value is not a string.')
		return changetype<string>(this.value as u32)
	}
}

declare namespace console {
	@external("console", "logs")
	export function logs(val: string): void;

    @external("console", "log")
    export function log<T>(val: T): void;
}


declare namespace api {
	type callback<T = JSON> = (j: T) => void
	type nestedCallback<T = JSON> = (j: JSON, callback: callback<T>) => void

    @external("api", "call")
    function call(module:string, storage:string, callback: callback) : JSON
    @external("api", "callWithArgNumber")
    function callArg<T>(module: string, storage: string, arg: T, callback: callback): JSON

    @external("api", "callWrapper")
    function callWrapper<T>(module:string, storage:string, callback0: nestedCallback<T>, callback1: callback<T>) : JSON

    @external("api", "callWithArgNumberWrapper")
    function callArgWrapper<T,K>(module: string, storage: string, arg: K, callback0: nestedCallback<T>, callback1: callback<T> ): JSON
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

	export function json(json: JSON): void {
		// FIXME! Handle non-objects
		const record = json.toObject()
		const keys = record.keys()

        response.pushObject()
        for (let i: i32 = 0; i < keys.length; i++) {
			produce.field(record, keys[i])
		}
        response.popObject()
	}
}

export namespace storage {
	function classify<T>(input: JSON): T {
		if (isInteger<T>()) {
			return input.toNumber()
		} else if (isSigned<T>()) {
			return input.toI32()
		} else if (isString<T>()) {
			return input.toString()
		} else{
			// Assume an object
			return instantiate<T>(input)
		}
	}

	export class Plain<T> {
		protected module: string
		protected address: string

		constructor(module: string, address: string) {
			this.module = module
			this.address = address
		}

		fetch( fn: (v: T) => void ): void {
			api.callWrapper<T>(this.module, this.address, (j: JSON, fn: api.callback<T>) => {
				fn(classify<T>(j))
			},fn)
		}
	}

	export class Map<K, T> extends Plain<T> {
		fetch( index: K, fn: (v: T) => void ): void {
			api.callArgWrapper<T,K>(this.module, this.address, index, (j: JSON, fn: api.callback<T>) => {
				fn(classify<T>(j))
			},fn)
		}
	}
}

export namespace codec {
	export class Codec {
		public JSON:JSON

		constructor(src: JSON) {
			this.JSON = src
		}
	}

	export class Struct extends Codec{
	}
}

export { console, api, response }
