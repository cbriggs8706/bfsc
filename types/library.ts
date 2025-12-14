// types/library.ts
export type LibraryQueryParams = {
	q?: string
	tag?: string
	type?: 'book' | 'equipment'
	sort?: 'name' | 'createdAt'
	dir?: 'asc' | 'desc'
	page?: number
	pageSize?: number
}
