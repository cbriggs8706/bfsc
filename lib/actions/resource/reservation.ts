// lib/actions/resource/reservation.ts
'use server'

import { unstable_noStore as noStore, revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { reservations } from '@/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

import { getAvailability } from './availability'
import { toLocalDateTime, toLocalYMD, toHHMM } from '@/utils/time'

/* ------------------------------------------------------------------ */
/* Types */
/* ------------------------------------------------------------------ */

export type AssistanceLevel = 'none' | 'startup' | 'full'
export type ReservationStatus = 'pending' | 'confirmed' | 'denied' | 'cancelled'

export type ReservationFormValues = {
	resourceId: string
	date: string // YYYY-MM-DD
	startTime: string // HH:mm (slot start)
	attendeeCount: string
	assistanceLevel: AssistanceLevel
	isClosedDayRequest: boolean
	notes: string
	status?: ReservationStatus // Admin-only
}

/* ------------------------------------------------------------------ */
/* Zod schema (server authority) */
/* ------------------------------------------------------------------ */

const ReservationInputSchema = z.object({
	resourceId: z.string().uuid(),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date (YYYY-MM-DD)'),
	startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time (HH:mm)'),

	attendeeCount: z.coerce.number().int().min(1),
	assistanceLevel: z.enum(['none', 'startup', 'full']),
	isClosedDayRequest: z.coerce.boolean(),
	notes: z.string().catch(''),

	status: z.enum(['pending', 'confirmed', 'denied', 'cancelled']).optional(),
})

export type ReservationActionResult =
	| { ok: true; isAdmin: boolean; id?: string }
	| { ok: false; message: string }

/* ------------------------------------------------------------------ */
/* Reads */
/* ------------------------------------------------------------------ */

export async function readReservation(id: string) {
	noStore()
	if (!id) throw new Error('Missing reservation id')

	return db.query.reservations.findFirst({
		where: eq(reservations.id, id),
		with: {
			user: { columns: { id: true, name: true, email: true } },
			resource: { columns: { id: true, name: true } },
		},
	})
}

export async function readReservations() {
	noStore()

	return db.query.reservations.findMany({
		orderBy: reservations.startTime,
		with: {
			user: { columns: { id: true, name: true, email: true } },
			resource: { columns: { id: true, name: true } },
		},
	})
}

/**
 * Form-shaped read (use this for update/delete pages so the form can hydrate cleanly)
 */
export async function readReservationForForm(id: string) {
	noStore()
	if (!id) throw new Error('Missing reservation id')

	const row = await db.query.reservations.findFirst({
		where: eq(reservations.id, id),
		columns: {
			id: true,
			resourceId: true,
			startTime: true,
			endTime: true,
			attendeeCount: true,
			assistanceLevel: true,
			isClosedDayRequest: true,
			notes: true,
			status: true,
		},
	})

	if (!row) return null

	const start = new Date(row.startTime)
	return {
		id: row.id,
		resourceId: row.resourceId,
		date: toLocalYMD(start),
		startTime: toHHMM(start),
		attendeeCount: String(row.attendeeCount ?? 1),
		assistanceLevel: row.assistanceLevel as AssistanceLevel,
		isClosedDayRequest: row.isClosedDayRequest ?? false,
		notes: row.notes ?? '',
		status: row.status as ReservationStatus,
	} satisfies ReservationFormValues & { id: string }
}

/* ------------------------------------------------------------------ */
/* Writes (Resource-style) */
/* ------------------------------------------------------------------ */

export async function saveReservation(
	mode: 'create' | 'update',
	reservationId: string | null,
	raw: unknown
): Promise<ReservationActionResult> {
	const session = await getServerSession(authOptions)
	if (!session) return { ok: false, message: 'Unauthorized' }

	const userId = session.user.id
	const isAdmin = session.user.role === 'Admin'

	const parsed = ReservationInputSchema.safeParse(raw)
	if (!parsed.success) {
		return {
			ok: false,
			message: parsed.error.issues[0]?.message ?? 'Invalid data',
		}
	}

	const data = parsed.data

	// Load availability, excluding this reservation on update
	const availability = await getAvailability({
		resourceId: data.resourceId,
		date: data.date,
		excludeReservationId:
			mode === 'update' ? reservationId ?? undefined : undefined,
	})

	// Must match an available slot
	const slot = availability.timeSlots.find(
		(s) => s.startTime === data.startTime
	)
	if (!slot) {
		return { ok: false, message: 'Selected time is no longer available' }
	}

	// Compute actual Date bounds from slot
	const start = toLocalDateTime(data.date, slot.startTime)
	const end = toLocalDateTime(data.date, slot.endTime)
	start.setSeconds(0, 0)
	end.setSeconds(0, 0)

	try {
		if (mode === 'create') {
			const [row] = await db
				.insert(reservations)
				.values({
					resourceId: data.resourceId,
					userId,

					startTime: start,
					endTime: end,

					attendeeCount: data.attendeeCount,
					assistanceLevel: data.assistanceLevel,
					isClosedDayRequest: data.isClosedDayRequest,
					notes: data.notes || null,

					status: isAdmin ? data.status ?? 'pending' : 'pending',
				})
				.returning({ id: reservations.id })
			//TODO add locale?
			revalidatePath('/admin/reservation')
			return { ok: true, isAdmin, id: row?.id }
		}

		// update
		if (!reservationId) return { ok: false, message: 'Missing reservation id' }

		await db
			.update(reservations)
			.set({
				resourceId: data.resourceId,
				startTime: start,
				endTime: end,

				attendeeCount: data.attendeeCount,
				assistanceLevel: data.assistanceLevel,
				isClosedDayRequest: data.isClosedDayRequest,
				notes: data.notes || null,

				// Admin may change status; otherwise keep existing status
				...(isAdmin && data.status ? { status: data.status } : {}),
			})
			.where(eq(reservations.id, reservationId))
		//TODO add locale?
		revalidatePath('/admin/reservation')
		revalidatePath(`/admin/reservation/${reservationId}`)
		return { ok: true, isAdmin }
	} catch {
		return { ok: false, message: 'Database error' }
	}
}

export async function deleteReservation(
	reservationId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
	const session = await getServerSession(authOptions)
	if (!session) return { ok: false, message: 'Unauthorized' }

	if (!reservationId) return { ok: false, message: 'Missing reservation id' }

	try {
		await db.delete(reservations).where(eq(reservations.id, reservationId))
		revalidatePath('/admin/reservation')
		return { ok: true }
	} catch {
		return { ok: false, message: 'Delete failed' }
	}
}
