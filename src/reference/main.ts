import { glue } from "joystream/query"
import { Category, forumCategories } from "./modules/forum"

export { 
	glue,

	forumCategories,
}

export namespace types {
	export const CategoryId = "u32"
	export const Category = Category.Codec()
}
