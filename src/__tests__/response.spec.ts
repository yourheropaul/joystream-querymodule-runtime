import { DeclareResolver, glue, Resolver, ResolverWrapper } from "../lib/joystream/query"

class DummyResolver extends Resolver {
    constructor() {
        super(["a", "b", "c"], "dummy")
    }
}

describe("Resolver logic", () => {
    it("should be possible to declare a resolver", () => {
        const w = DeclareResolver<DummyResolver>()
        // expect<string>(w.r.SDLType).toBe("dummy", "SDLType should be set")

        glue.ResolveQuery(w)
    })
})
