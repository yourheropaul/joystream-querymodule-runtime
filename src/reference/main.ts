import { DeclareResolver, glue } from "joystream/query"
import { Category as CategoryType, CategoryList } from "./modules/forum"

export {
    glue,
}

// tslint:disable-next-line:no-namespace
export namespace types {
    export const CategoryId = "u32"
    export const Category = CategoryType.Codec()
}

// tslint:disable-next-line:no-namespace
export namespace resolvers {
    export const forumCategories = DeclareResolver<CategoryList>()
}
