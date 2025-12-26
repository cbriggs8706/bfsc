// // db/queries/resources/reservations.ts
// import { db } from '@/db'
// import { reservations } from '@/db'
// import { resources } from '@/db/schema/tables/resource'
// import { user } from '@/db/schema/tables/auth'
// import { eq, sql, and, gte } from 'drizzle-orm'
// import {
// 	AssistanceLevel,
// 	ReservationListItem,
// 	ResourceType,
// } from '@/types/resource'
// import { isResourceType } from '@/lib/reservations/resource-type'

// export async function getPendingReservations(): Promise<ReservationListItem[]> {
// 	const rows = await db
// 		.select({
// 			id: reservations.id,
// 			resourceName: resources.name,
// 			resourceType: resources.type,
// 			startTime: reservations.startTime,
// 			endTime: reservations.endTime,
// 			isClosedDayRequest: reservations.isClosedDayRequest,
// 			requestedByName: user.name,
// 			notes: reservations.notes,
// 			attendeeCount: reservations.attendeeCount,
// 			assistanceLevel: reservations.assistanceLevel,
// 		})
// 		.from(reservations)
// 		.innerJoin(resources, eq(reservations.resourceId, resources.id))
// 		.innerJoin(user, eq(reservations.userId, user.id))
// 		.where(eq(reservations.status, 'pending'))
// 		.orderBy(sql`${reservations.startTime} asc`)

// 	return rows
// 		.filter((r): r is typeof r & { resourceType: ResourceType } =>
// 			isResourceType(r.resourceType)
// 		)
// 		.map((r) => ({
// 			id: r.id,
// 			resourceName: r.resourceName,
// 			resourceType: r.resourceType, // now narrowed
// 			startTime: r.startTime.toISOString(),
// 			endTime: r.endTime.toISOString(),
// 			isClosedDayRequest: r.isClosedDayRequest,
// 			requestedByName: r.requestedByName,
// 			notes: r.notes,
// 			attendeeCount: r.attendeeCount,
// 			assistanceLevel: r.assistanceLevel as AssistanceLevel,
// 		}))
// }

// export async function getApprovedReservations(): Promise<
// 	ReservationListItem[]
// > {
// 	const now = new Date()

// 	const rows = await db
// 		.select({
// 			id: reservations.id,
// 			resourceName: resources.name,
// 			resourceType: resources.type,

// 			startTime: reservations.startTime,
// 			endTime: reservations.endTime,

// 			isClosedDayRequest: reservations.isClosedDayRequest,

// 			requestedByName: user.name,

// 			attendeeCount: reservations.attendeeCount,
// 			assistanceLevel: reservations.assistanceLevel,

// 			notes: reservations.notes,
// 		})
// 		.from(reservations)
// 		.innerJoin(resources, eq(reservations.resourceId, resources.id))
// 		.innerJoin(user, eq(reservations.userId, user.id))
// 		.where(
// 			and(
// 				eq(reservations.status, 'approved'),
// 				gte(reservations.endTime, now) // ✅ today + future
// 			)
// 		)
// 		.orderBy(sql`${reservations.startTime} asc`)

// 	return rows
// 		.filter((r): r is typeof r & { resourceType: ResourceType } =>
// 			isResourceType(r.resourceType)
// 		)
// 		.map((r) => ({
// 			...r,
// 			startTime: r.startTime.toISOString(),
// 			endTime: r.endTime.toISOString(),
// 			assistanceLevel: r.assistanceLevel as AssistanceLevel,
// 		}))
// }
