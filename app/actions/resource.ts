// app/actions/resource/actions.ts
'use server'

import { db } from '@/db'
import { resource } from '@/db/schema/tables/resource'
import { requireAdmin } from '@/lib/requireAdmin'
import { eq } from 'drizzle-orm'
import { ResourceType } from '@/types/resource'

export async function createResource(input: {
	name: string
	type: ResourceType
	defaultDurationMinutes: number
	maxConcurrent: number
	capacity?: number | null
	description?: string | null
	requiredItems?: string | null
	prep?: string | null
	notes?: string | null
	link?: string | null
	isActive?: boolean
}) {
	await requireAdmin()

	const [created] = await db
		.insert(resource)
		.values({
			name: input.name,
			type: input.type,
			defaultDurationMinutes: input.defaultDurationMinutes,
			maxConcurrent: input.maxConcurrent,
			capacity: input.capacity ?? null,

			description: input.description ?? null,
			requiredItems: input.requiredItems ?? null,
			prep: input.prep ?? null,
			notes: input.notes ?? null,
			link: input.link ?? null,

			isActive: true,
		})
		.returning()

	return {
		id: created.id,
		name: created.name,
		type: created.type as ResourceType,
		defaultDurationMinutes: created.defaultDurationMinutes,
		maxConcurrent: created.maxConcurrent,
		capacity: created.capacity,

		description: created.description,
		requiredItems: created.requiredItems,
		prep: created.prep,
		notes: created.notes,
		link: created.link,

		isActive: created.isActive,
	}
}

export async function updateResource(input: {
	id: string
	name: string
	type: ResourceType
	defaultDurationMinutes: number
	maxConcurrent: number
	isActive: boolean
}) {
	await requireAdmin()

	await db
		.update(resource)
		.set({
			name: input.name,
			type: input.type,
			defaultDurationMinutes: input.defaultDurationMinutes,
			maxConcurrent: input.maxConcurrent,
			isActive: input.isActive,
		})
		.where(eq(resource.id, input.id))
}

export async function deactivateResource(id: string) {
	await requireAdmin()

	await db.update(resource).set({ isActive: false }).where(eq(resource.id, id))
}
