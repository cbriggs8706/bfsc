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

export type LibraryItemFormInput = {
	type: 'book' | 'equipment'
	name: string
	description: string
	year?: number
	authorManufacturer?: string
	isbn?: string
	notes?: string
	copyCodes: string[]
	tags: string[]
}

export type LibraryItemType = 'book' | 'equipment'

export type LibraryItem = {
	id: string
	name: string
	type: LibraryItemType
	description: string
	year?: number
	authorManufacturer?: string
	isbn?: string
	notes?: string
	copyCodes: string[]
	tags: string[]
}
