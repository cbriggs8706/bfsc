// lib/actions/resource/reservation.ts
'use server'

import { unstable_noStore as noStore, revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db, reservation } from '@/db'
import { Reservation } from '@/types/resource'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAvailability } from './availability'
import { toLocalDateTime, toLocalYMD } from '@/utils/time'

/* -------------------------------------------------
 * Reads
 * ------------------------------------------------- */

export async function readReservation(id: string) {
	noStore()

	if (!id) throw new Error('Missing reservation id')

	return db.query.reservation.findFirst({
		where: eq(reservation.id, id),
		with: {
			user: {
				columns: {
					id: true,
					name: true,
					email: true,
				},
			},
			resource: {
				columns: {
					id: true,
					name: true,
				},
			},
		},
	})
}

export async function readReservations() {
	noStore()

	return db.query.reservation.findMany({
		orderBy: reservation.startTime,
		with: {
			user: {
				columns: {
					id: true,
					name: true,
					email: true,
				},
			},
			resource: {
				columns: {
					id: true,
					name: true,
				},
			},
		},
	})
}

/* -------------------------------------------------
 * Writes
 * ------------------------------------------------- */

export async function createReservation(input: Reservation) {
	'use server'

	const session = await getServerSession(authOptions)
	if (!session) throw new Error('Unauthorized')

	const userId = session.user.id
	const isAdmin = session.user.role === 'Admin'

	if (!input.resourceId) throw new Error('Resource is required')
	if (!input.startTime || !input.endTime) {
		throw new Error('Time block required')
	}

	const start = new Date(input.startTime)
	const end = new Date(input.endTime)

	// normalize seconds/ms
	start.setSeconds(0, 0)
	end.setSeconds(0, 0)

	const date = toLocalYMD(start)
	// availability check
	const availability = await getAvailability({
		resourceId: input.resourceId,
		date,
	})

	const isValid = availability.timeSlots.some((s) => {
		const slotStart = toLocalDateTime(date, s.startTime)
		const slotEnd = toLocalDateTime(date, s.endTime)

		return (
			start.getTime() === slotStart.getTime() &&
			end.getTime() === slotEnd.getTime()
		)
	})

	if (!isValid) {
		throw new Error('Selected time is no longer available')
	}

	await db.insert(reservation).values({
		...input,
		startTime: start,
		endTime: end,
		userId,
		status: isAdmin ? input.status ?? 'pending' : 'pending',
	})

	revalidatePath('/admin/reservation')

	return {
		ok: true,
		isAdmin,
	}
}

export async function updateReservation(id: string, input: Reservation) {
	if (!id) throw new Error('Missing reservation id')

	if (input.startTime && input.endTime) {
		if (new Date(input.endTime) <= new Date(input.startTime)) {
			throw new Error('End time must be after start time')
		}
	}
	const start = new Date(input.startTime)
	const end = new Date(input.endTime)

	// normalize seconds/ms
	start.setSeconds(0, 0)
	end.setSeconds(0, 0)

	const date = toLocalYMD(start)

	// 🔐 FINAL SERVER-SIDE SAFETY CHECK
	const availability = await getAvailability({
		resourceId: input.resourceId,
		date,
		excludeReservationId: id,
	})

	const isValid = availability.timeSlots.some((s) => {
		const slotStart = toLocalDateTime(date, s.startTime)
		const slotEnd = toLocalDateTime(date, s.endTime)

		return (
			start.getTime() === slotStart.getTime() &&
			end.getTime() === slotEnd.getTime()
		)
	})

	if (!isValid) throw new Error('Selected time is no longer available')

	const [row] = await db
		.update(reservation)
		.set({
			...input,
			startTime: start,
			endTime: end,
		})
		.where(eq(reservation.id, id))
		.returning()

	revalidatePath(`/admin/reservation/${id}`)

	return row
}

export async function deleteReservation(id: string) {
	if (!id) throw new Error('Missing reservation id')

	await db.delete(reservation).where(eq(reservation.id, id))

	revalidatePath('/admin/reservation')
}
