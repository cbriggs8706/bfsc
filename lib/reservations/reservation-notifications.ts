// lib/reservations/reservation-notifications.ts
import { notify } from '@/db/queries/notifications'

type Tx = {
	insert: typeof import('@/db').db.insert
}

export async function notifyReservationSubmitted(
	tx: Tx,
	input: {
		userIds: string[]
		resourceName: string
		startTime: Date
	}
) {
	const message = `New reservation request for ${
		input.resourceName
	} on ${input.startTime.toLocaleString()}.`

	for (const userId of input.userIds) {
		await notify(tx, {
			userId,
			type: 'reservation_submitted',
			message,
		})
	}
}

export async function notifyReservationApproved(
	tx: Tx,
	input: {
		userId: string
		resourceName: string
		startTime: Date
	}
) {
	await notify(tx, {
		userId: input.userId,
		type: 'reservation_approved',
		message: `Your reservation for ${
			input.resourceName
		} on ${input.startTime.toLocaleString()} was approved.`,
	})
}

export async function notifyReservationDenied(
	tx: Tx,
	input: {
		userId: string
		resourceName: string
		startTime: Date
	}
) {
	await notify(tx, {
		userId: input.userId,
		type: 'reservation_denied',
		message: `Your reservation for ${
			input.resourceName
		} on ${input.startTime.toLocaleString()} was denied.`,
	})
}
