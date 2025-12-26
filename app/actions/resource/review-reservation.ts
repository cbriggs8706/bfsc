// app/actions/reviewReservation.ts
'use server'

import { db } from '@/db'
import { reservations } from '@/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { eq } from 'drizzle-orm'
import { ReservationApprovalAction } from '@/types/resource'
import {
	notifyReservationApproved,
	notifyReservationDenied,
} from '@/lib/reservations/reservation-notifications'

export async function reviewReservation(input: {
	reservationId: string
	action: ReservationApprovalAction
}): Promise<{ success: true } | { success: false; error: string }> {
	const session = await getServerSession(authOptions)

	if (!session?.user?.id) {
		return { success: false, error: 'Not authenticated' }
	}

	const role = session.user.role
	if (role !== 'Consultant' && role !== 'Admin') {
		return { success: false, error: 'Not authorized' }
	}

	await db.transaction(async (tx) => {
		const reservation = await tx.query.reservations.findFirst({
			where: eq(reservations.id, input.reservationId),
		})

		if (!reservation) return

		await tx
			.update(reservations)
			.set({
				status: input.action === 'approve' ? 'approved' : 'denied',
				approvedByUserId: session.user.id,
				assignedConsultantId:
					input.action === 'approve' ? session.user.id : null,
			})
			.where(eq(reservations.id, reservation.id))

		if (input.action === 'approve') {
			await notifyReservationApproved(tx, {
				userId: reservation.userId,
				resourceName: 'Selected Resource',
				startTime: reservation.startTime,
			})
		} else {
			await notifyReservationDenied(tx, {
				userId: reservation.userId,
				resourceName: 'Selected Resource',
				startTime: reservation.startTime,
			})
		}
	})

	return { success: true }
}
