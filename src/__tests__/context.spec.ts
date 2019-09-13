import { Context, glue, TypedMap, JSON  } from "../lib/joystream/query"

class MockObject {
    a:u32
}

describe("Context logic", () => {
    it("should be possible for glue code should be able to initialise contexts", () => {
       const c = glue.NewContext(new TypedMap<string,JSON>()) 
       expect<u32>(c.id).toBe(changetype<u32>(c), "context value should be passed through")
    })

    it("should bind contexts to objects", () => {
       const c = glue.NewContext(new TypedMap<string,JSON>()) 
       const obj = new MockObject()

       // Get an unpredicatable number
       obj.a = changetype<u32>(c)

       c.ptr = changetype<u32>(obj)
       const output = c.as<MockObject>()
       expect<u32>(output.a).toBe(obj.a, "context payload should be passed through")
    })
})
