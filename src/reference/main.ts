import { glue } from "joystream/query"
import { Category as CategoryType, forumCategories } from "./modules/forum"

export {
    glue,

    forumCategories,
}

// tslint:disable-next-line:no-namespace
export namespace types {
    export const CategoryId = "u32"
    export const Category = CategoryType.Codec()
}
