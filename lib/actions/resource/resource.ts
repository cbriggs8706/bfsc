// lib/actions/resource/resource.ts
'use server'

import { db } from '@/db'
import { and, eq, ilike, count } from 'drizzle-orm'
import { resources } from '@/db/schema/tables/resources'
import { z } from 'zod'

export type ResourceType = 'equipment' | 'room' | 'booth' | 'activity'

const ResourceInputSchema = z.object({
	name: z.string().min(1),
	type: z.enum(['equipment', 'room', 'booth', 'activity']),
	defaultDurationMinutes: z.coerce.number().min(1),
	maxConcurrent: z.coerce.number().optional(),
	capacity: z.coerce.number().nullable().optional(),
	isActive: z.coerce.boolean(),
	description: z.string().optional(),
	requiredItems: z.string().optional(),
	prep: z.string().optional(),
	notes: z.string().optional(),
	image: z.string().optional(),
	link: z.union([z.literal(''), z.string().url()]).optional(),
	video: z.union([z.literal(''), z.string().url()]).optional(),
})

export type ResourceActionResult = { ok: true } | { ok: false; message: string }

export async function readResource(resourceId: string) {
	const row = await db.query.resources.findFirst({
		where: eq(resources.id, resourceId),
	})

	if (!row) return null

	return {
		name: row.name,
		type: row.type as ResourceType,

		defaultDurationMinutes: String(row.defaultDurationMinutes),
		maxConcurrent: String(row.maxConcurrent),
		capacity: row.capacity !== null ? String(row.capacity) : '',

		isActive: row.isActive,

		description: row.description ?? '',
		requiredItems: row.requiredItems ?? '',
		prep: row.prep ?? '',
		notes: row.notes ?? '',
		image: row.image ?? '',
		link: row.link ?? '',
		video: row.video ?? '',
	}
}

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
		where.push(eq(resources.type, filters.type))
	}

	if (filters?.q) {
		where.push(ilike(resources.name, `%${filters.q}%`))
	}

	const rows = await db
		.select({
			id: resources.id,
			name: resources.name,
			type: resources.type,
			isActive: resources.isActive,
			defaultDurationMinutes: resources.defaultDurationMinutes,
			maxConcurrent: resources.maxConcurrent,
			capacity: resources.capacity,
			description: resources.description,
			requiredItems: resources.requiredItems,
			prep: resources.prep,
			notes: resources.notes,
			image: resources.image,
			link: resources.link,
			video: resources.video,
		})
		.from(resources)
		.where(and(...where))
		.orderBy(resources.name)
		.limit(pageSize)
		.offset((page - 1) * pageSize)

	const [{ count: total }] = await db
		.select({ count: count() })
		.from(resources)
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
			image: r.image,
			link: r.link,
			video: r.video,
		})),
		total: Number(total),
	}
}

export async function saveResource(
	mode: 'create' | 'update',
	resourceId: string | null,
	raw: unknown
): Promise<ResourceActionResult> {
	const parsed = ResourceInputSchema.safeParse(raw)

	if (!parsed.success) {
		return {
			ok: false,
			message: parsed.error.issues[0]?.message ?? 'Invalid data',
		}
	}

	const data = parsed.data

	try {
		if (mode === 'create') {
			await db.insert(resources).values({
				...data,
				maxConcurrent: data.type === 'activity' ? 1 : data.maxConcurrent ?? 1,
				capacity: data.type === 'activity' ? data.capacity ?? null : null,
			})
		} else {
			await db
				.update(resources)
				.set({
					...data,
					maxConcurrent: data.type === 'activity' ? 1 : data.maxConcurrent ?? 1,
					capacity: data.type === 'activity' ? data.capacity ?? null : null,
				})
				.where(eq(resources.id, resourceId!))
		}

		return { ok: true }
	} catch {
		return { ok: false, message: 'Database error' }
	}
}

export async function deleteResource(
	resourceId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
	try {
		await db.delete(resources).where(eq(resources.id, resourceId))
		return { ok: true }
	} catch {
		return { ok: false, message: 'Delete failed' }
	}
}
