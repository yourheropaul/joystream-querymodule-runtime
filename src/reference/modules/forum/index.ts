import { produce } from "joystream/query"
import { Struct } from "joystream/query/codec"
import { Plain, Map } from "joystream/query/storage"

export type CategoryId = u32

export class Category extends Struct {
	public static Codec(): string {
		return `{"id": "CategoryId", "title": "Text", "description": "Text", "deleted": "Bool", "archived": "Bool"}`
	}
}

export const NextCategoryId = new Plain<CategoryId>("forum", "nextCategoryId")
export const CategoryById = new Map<CategoryId, Category>("forum", "CategoryById")

export function forumCategories(): void {
	NextCategoryId.fetch((nextId: CategoryId) => {
		for (let i:CategoryId = 1; i < nextId; i++) {
			CategoryById.fetch(i, (category: Category) => {
				produce.json(category.JSON)
			})
		}
	})
}
