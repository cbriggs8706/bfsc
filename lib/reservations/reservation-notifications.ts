// lib/reservations/reservation-notifications.ts

// TODO replace
import { notify } from '@/db/queries/notifications'

type Tx = {
	insert: typeof import('@/db').db.insert
}

type NotificationTimeOpts = {
	timeZone?: string
}

export async function notifyReservationSubmitted(
	tx: Tx,
	input: {
		userIds: string[]
		resourceName: string
		startTime: Date
	} & NotificationTimeOpts
) {
	const message = `New reservation request for ${
		input.resourceName
	} on ${input.startTime.toLocaleString(undefined, {
		timeZone: input.timeZone,
	})}.`

	for (const userId of input.userIds) {
		await notify(tx, {
			userId,
			type: 'reservation_submitted',
			message,
		})
	}
}

export async function notifyReservationConfirmation(
	tx: Tx,
	input: {
		userId: string
		resourceName: string
		startTime: Date
	} & NotificationTimeOpts
) {
	await notify(tx, {
		userId: input.userId,
		type: 'reservation_confirmed',
		message: `Your reservation for ${
			input.resourceName
		} on ${input.startTime.toLocaleString(undefined, {
			timeZone: input.timeZone,
		})} was confirmed.`,
	})
}

export async function notifyReservationDenied(
	tx: Tx,
	input: {
		userId: string
		resourceName: string
		startTime: Date
	} & NotificationTimeOpts
) {
	await notify(tx, {
		userId: input.userId,
		type: 'reservation_denied',
		message: `Your reservation for ${
			input.resourceName
		} on ${input.startTime.toLocaleString(undefined, {
			timeZone: input.timeZone,
		})} was denied.`,
	})
}
