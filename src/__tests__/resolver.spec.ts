import { Context, DeclareResolver, glue, Resolver } from "../lib/joystream/query"

let callbackInvoked:u32 = 0
let contextId = -1
let abitraryValue = 0

function reset():void {
    callbackInvoked = 0
    contextId = -1
    abitraryValue = 0
}

class MockResolver extends Resolver {
    someValue: u32

    constructor() {
        super(["a", "b", "c"], "dummy")
        this.someValue = 10
    }

    resolve(ctx: Context): void {
        callbackInvoked = 1
        contextId = ctx.id

        const self = ctx.as<MockResolver>()
        abitraryValue = self.someValue
    }
}

describe("Resolver logic", () => {
    it("should be possible to declare a resolver", () => {
        const w = DeclareResolver<MockResolver>()
    })

    it("should be possible to invoke resolvers", () => {
        reset()

        const w = DeclareResolver<MockResolver>()
        glue.ResolveQuery(w, new Context())
        
        expect<u32>(callbackInvoked).toBe(1, "resolver callback should work")
    })

    it("should pass contexts to resolver callbacks", () => {
        reset()

        const w = DeclareResolver<MockResolver>()
        const c = new Context()

        // Set an unpredictable ID
        c.id = changetype<u32>(c)

        glue.ResolveQuery(w, c)
        expect<u32>(contextId).toBe(c.id, "context ID should be set")
    })

    it("should bind the context automatically", () => {
        reset()

        const w = DeclareResolver<MockResolver>()
        glue.ResolveQuery(w, new Context())
        
        expect<u32>(abitraryValue).toBe(10, "resolver context should pass through")
    })
})
