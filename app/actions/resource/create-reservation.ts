// app/actions/resources/create-reservation.ts
'use server'

import { db, user } from '@/db'
import { reservations } from '@/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { validateReservationRequest } from '@/lib/reservations/validate-reservation'
import { sql } from 'drizzle-orm'
import { notifyReservationSubmitted } from '@/lib/reservations/reservation-notifications'
import { AssistanceLevel } from '@/types/resource'

export async function createReservation(input: {
	resourceId: string
	startTime: Date
	isClosedDayRequest: boolean
	notes?: string
	attendeeCount: number
	assistanceLevel: AssistanceLevel
}): Promise<{ success: true } | { success: false; error: string }> {
	const session = await getServerSession(authOptions)
	if (!session?.user?.id) {
		return { success: false, error: 'Authentication required' }
	}

	const resource = await db.query.resources.findFirst({
		where: (r, { eq }) => eq(r.id, input.resourceId),
	})

	if (!resource) {
		return { success: false, error: 'Invalid resource' }
	}

	// ✅ Compute once
	const endTime = new Date(
		input.startTime.getTime() + resource.defaultDurationMinutes * 60 * 1000
	)

	const validation = await validateReservationRequest({
		resourceId: input.resourceId,
		startTime: input.startTime,
		endTime,
		isClosedDayRequest: input.isClosedDayRequest,
	})

	if (!validation.ok) {
		return {
			success: false,
			error: validation.reason ?? 'Reservation is not available',
		}
	}

	await db.transaction(async (tx) => {
		// ✅ Use the same endTime here
		const [reservation] = await tx
			.insert(reservations)
			.values({
				resourceId: input.resourceId,
				userId: session.user.id,
				startTime: input.startTime,
				endTime,
				isClosedDayRequest: input.isClosedDayRequest,
				notes: input.notes ?? null,
				attendeeCount: input.attendeeCount,
				assistanceLevel: input.assistanceLevel,
			})
			.returning()

		// Find consultants + admins
		const reviewers = await tx
			.select({ id: user.id })
			.from(user)
			.where(sql`${user.role} in ('Consultant','Admin')`)

		await notifyReservationSubmitted(tx, {
			userIds: reviewers.map((r) => r.id),
			resourceName: resource.name,
			startTime: input.startTime,
		})
	})

	return { success: true }
}
