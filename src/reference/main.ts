import { DeclareResolver, glue } from "joystream/query"
import { Category, Thread, CategoryList, ThreadList } from "./modules/forum"

export {
    glue,
}

// tslint:disable-next-line:no-namespace
export namespace types {
    export const CategoryId = "u32"
    export const Category = Category.Codec()
    export const Thread = Thread.Codec()
}

// tslint:disable-next-line:no-namespace
export namespace resolvers {
    export const forumCategories = DeclareResolver<CategoryList>()
    export const forumThreads = DeclareResolver<ThreadList>()
}
