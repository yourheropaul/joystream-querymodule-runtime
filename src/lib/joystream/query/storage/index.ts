import { api, JSON } from ".."

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
		}, fn)
	}
}

export class Map<K, T> extends Plain<T> {
	fetch( index: K, fn: (v: T) => void ): void {
		api.callArgWrapper<T,K>(this.module, this.address, index, (j: JSON, fn: api.callback<T>) => {
			fn(classify<T>(j))
		}, fn)
	}
}

