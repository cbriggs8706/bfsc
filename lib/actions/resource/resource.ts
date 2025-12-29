// lib/actions/resource/resource.ts
'use server'

import { db } from '@/db'
import { eq, and, ilike, count } from 'drizzle-orm'
import { resource } from '@/db/schema/tables/resource'

/* ------------------------------------------------------------------ */
/* Types */
/* ------------------------------------------------------------------ */

export type ResourceType = 'equipment' | 'room' | 'booth' | 'activity'

export type ResourceInput = {
	name: string
	type: ResourceType
	defaultDurationMinutes: number
	maxConcurrent: number
	capacity?: number | null
	isActive: boolean

	description?: string
	requiredItems?: string
	prep?: string
	notes?: string
	link?: string
}

export type ResourceActionResult = { ok: true; id?: string } | { ok: false }

/* ------------------------------------------------------------------ */
/* READ (FORM-SHAPED) */
/* ------------------------------------------------------------------ */

export async function readResource(resourceId: string) {
	const row = await db.query.resource.findFirst({
		where: eq(resource.id, resourceId),
	})

	if (!row) return null

	// 🔁 Normalize DB → form shape HERE
	return {
		name: row.name,
		type: row.type as ResourceType,

		defaultDurationMinutes: row.defaultDurationMinutes,
		maxConcurrent: row.maxConcurrent,
		capacity: row.capacity ?? undefined,
		isActive: row.isActive,

		description: row.description ?? '',
		requiredItems: row.requiredItems ?? '',
		prep: row.prep ?? '',
		notes: row.notes ?? '',
		link: row.link ?? '',
	}
}

/* ------------------------------------------------------------------ */
/* READ ALL (TABLE / LIST SHAPE) */
/* ------------------------------------------------------------------ */

export async function readAllResources(filters?: {
	q?: string
	type?: ResourceType
	page?: number
	pageSize?: number
}) {
	const page = filters?.page ?? 1
	const pageSize = filters?.pageSize ?? 25

	const where = []

	if (filters?.type) {
		where.push(eq(resource.type, filters.type))
	}

	if (filters?.q) {
		where.push(ilike(resource.name, `%${filters.q}%`))
	}

	const rows = await db
		.select({
			id: resource.id,
			name: resource.name,
			type: resource.type,
			isActive: resource.isActive,
			defaultDurationMinutes: resource.defaultDurationMinutes,
			maxConcurrent: resource.maxConcurrent,
			capacity: resource.capacity,
			description: resource.description,
			requiredItems: resource.requiredItems,
			prep: resource.prep,
			notes: resource.notes,
			link: resource.link,
		})
		.from(resource)
		.where(and(...where))
		.limit(pageSize)
		.offset((page - 1) * pageSize)
		.orderBy(resource.name)

	const [{ count: total }] = await db
		.select({ count: count() })
		.from(resource)
		.where(and(...where))

	return {
		items: rows.map((r) => ({
			id: r.id,
			name: r.name,
			type: r.type as ResourceType,
			isActive: r.isActive,
			defaultDurationMinutes: r.defaultDurationMinutes,
			maxConcurrent: r.maxConcurrent,
			capacity: r.capacity,
			description: r.description,
			requiredItems: r.requiredItems,
			prep: r.prep,
			notes: r.notes,
			link: r.link,
		})),
		total: Number(total),
	}
}

/* ------------------------------------------------------------------ */
/* CREATE */
/* ------------------------------------------------------------------ */

export async function createResource(
	input: ResourceInput
): Promise<ResourceActionResult> {
	const id = await db.transaction(async (tx) => {
		const [row] = await tx
			.insert(resource)
			.values({
				name: input.name,
				type: input.type,
				defaultDurationMinutes: input.defaultDurationMinutes,

				maxConcurrent: input.type === 'activity' ? 1 : input.maxConcurrent,

				capacity: input.type === 'activity' ? input.capacity ?? null : null,

				isActive: input.isActive,

				description: input.description ?? null,
				requiredItems: input.requiredItems ?? null,
				prep: input.prep ?? null,
				notes: input.notes ?? null,
				link: input.link ?? null,
			})
			.returning({ id: resource.id })

		return row.id
	})

	return { ok: true, id }
}

/* ------------------------------------------------------------------ */
/* UPDATE */
/* ------------------------------------------------------------------ */

export async function updateResource(
	resourceId: string,
	input: ResourceInput
): Promise<ResourceActionResult> {
	await db.transaction(async (tx) => {
		await tx
			.update(resource)
			.set({
				name: input.name,
				type: input.type,
				defaultDurationMinutes: input.defaultDurationMinutes,

				maxConcurrent: input.type === 'activity' ? 1 : input.maxConcurrent,

				capacity: input.type === 'activity' ? input.capacity ?? null : null,

				isActive: input.isActive,

				description: input.description ?? null,
				requiredItems: input.requiredItems ?? null,
				prep: input.prep ?? null,
				notes: input.notes ?? null,
				link: input.link ?? null,
			})
			.where(eq(resource.id, resourceId))
	})

	return { ok: true }
}

/* ------------------------------------------------------------------ */
/* DELETE */
/* ------------------------------------------------------------------ */

export async function deleteResource(
	resourceId: string
): Promise<{ ok: true }> {
	await db.delete(resource).where(eq(resource.id, resourceId))
	return { ok: true }
}
