// // db/queries/resources/resources.ts
// import { db } from '@/db'
// import { resources } from '@/db/schema/tables/resource'
// import { isResourceType } from '@/lib/reservations/resource-type'
// import { ResourceOption, ResourceType } from '@/types/resource'
// import { eq } from 'drizzle-orm'

// export async function getActiveResources(): Promise<ResourceOption[]> {
// 	const rows = await db
// 		.select({
// 			id: resources.id,
// 			name: resources.name,
// 			type: resources.type,
// 			defaultDurationMinutes: resources.defaultDurationMinutes,
// 		})
// 		.from(resources)
// 		.where(eq(resources.isActive, true))
// 		.orderBy(resources.name)

// 	return rows
// 		.filter((r): r is typeof r & { type: ResourceType } =>
// 			isResourceType(r.type)
// 		)
// 		.map((r) => ({
// 			id: r.id,
// 			name: r.name,
// 			type: r.type, // now correctly narrowed
// 			defaultDurationMinutes: r.defaultDurationMinutes,
// 		}))
// }
