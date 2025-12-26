// db/queries/resources/admin.ts
import { db } from '@/db'
import { resources } from '@/db/schema/tables/resource'
import { desc } from 'drizzle-orm'
import { Resource, ResourceType } from '@/types/resource'
import { isResourceType } from '@/lib/reservations/resource-type'
import { unstable_noStore as noStore } from 'next/cache'

export async function getAllResources(): Promise<Resource[]> {
	noStore()

	const rows = await db
		.select()
		.from(resources)
		.orderBy(desc(resources.createdAt))

	return rows
		.filter((r): r is typeof r & { type: ResourceType } =>
			isResourceType(r.type)
		)
		.map((r) => ({
			id: r.id,
			name: r.name,
			type: r.type,
			defaultDurationMinutes: r.defaultDurationMinutes,
			maxConcurrent: r.maxConcurrent,
			capacity: r.capacity,

			description: r.description,
			requiredItems: r.requiredItems,
			prep: r.prep,
			notes: r.notes,
			link: r.link,

			isActive: r.isActive,
		}))
}
