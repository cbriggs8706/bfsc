// db/queries/reservation-notifications.ts
import {
	db,
	reservations,
	wards,
	stakes,
	faiths,
	resources,
	user,
	shiftRecurrences,
	shiftAssignments,
	kioskPeople,
} from '@/db'
import { StaffRecipient } from '@/types/resource'
import { and, eq } from 'drizzle-orm'

export type ReservationNotificationContext = {
	reservationId: string
	locale: string
	submitterEmail?: string | null

	staffRecipients: StaffRecipient[]

	resourceName?: string | null
	wardName?: string | null
	stakeName?: string | null
	faithName?: string | null
}

/**
 * Gets director + assistant directors (by stake if wardId exists) + submitter email.
 * Resolves staff recipients (Directors, Assistant Directors by stake, Shift Leader)
 * and submitter email for reservation notifications. */
export async function getReservationNotificationContext(
	reservationId: string
): Promise<ReservationNotificationContext | null> {
	const rows = await db
		.select({
			reservationId: reservations.id,
			locale: reservations.locale,
			submitterEmail: user.email,

			resourceName: resources.name,

			wardId: wards.id,
			wardName: wards.name,

			stakeId: stakes.id,
			stakeName: stakes.name,

			faithName: faiths.name,

			weeklyShiftId: reservations.weeklyShiftId,
		})
		.from(reservations)
		.leftJoin(user, eq(reservations.userId, user.id))
		.leftJoin(resources, eq(reservations.resourceId, resources.id))
		.leftJoin(wards, eq(reservations.wardId, wards.id))
		.leftJoin(stakes, eq(wards.stakeId, stakes.id))
		.leftJoin(faiths, eq(reservations.faithId, faiths.id))
		.where(eq(reservations.id, reservationId))
		.limit(1)

	const r = rows[0]
	if (!r) return null

	console.log('[notify] reservationId:', reservationId)
	console.log('[notify] raw context row:', r)

	// 1) Director(s)
	const directors = await db.query.user.findMany({
		where: eq(user.role, 'Director'),
		columns: { name: true, email: true },
	})

	const directorStaff: StaffRecipient[] = directors
		.filter((d) => d.email)
		.map((d) => ({
			name: d.name,
			email: d.email!,
			role: 'Director',
		}))

	console.log(
		'[notify] directors:',
		directors.map((d) => d.email)
	)

	// 2) Assistant directors for the same stake (ONLY if ward selected)
	// let assistantDirectors: { email: string | null }[] = []

	// console.log('[notify] resolving assistant directors by stake:', {
	// 	stakeId: r.stakeId,
	// })

	// if (!r.stakeId) {
	// 	console.log('[notify] no stakeId → skipping assistant directors')
	// } else {
	// 	assistantDirectors = await db
	// 		.select({ email: user.email })
	// 		.from(user)
	// 		.innerJoin(kioskPeople, eq(kioskPeople.userId, user.id))
	// 		.innerJoin(wards, eq(kioskPeople.wardId, wards.id))
	// 		.where(
	// 			and(eq(user.role, 'Assistant Director'), eq(wards.stakeId, r.stakeId))
	// 		)

	// 	console.log(
	// 		'[notify] assistant directors (stake-level):',
	// 		assistantDirectors.map((a) => a.email)
	// 	)
	// }
	let assistantStaff: StaffRecipient[] = []

	if (r.stakeId) {
		const assistants = await db
			.select({
				name: user.name,
				email: user.email,
			})
			.from(user)
			.innerJoin(kioskPeople, eq(kioskPeople.userId, user.id))
			.innerJoin(wards, eq(kioskPeople.wardId, wards.id))
			.where(
				and(eq(user.role, 'Assistant Director'), eq(wards.stakeId, r.stakeId))
			)

		assistantStaff = assistants
			.filter((a) => a.email)
			.map((a) => ({
				name: a.name,
				email: a.email!,
				role: 'Assistant Director',
			}))
	}

	// 3) Shift leader (via weeklyShift → recurrence → assignment)
	// let shiftLeaderEmail: string | null = null

	// if (!r.weeklyShiftId) {
	// 	console.log('[notify] no weeklyShiftId → skipping shift leader')
	// } else {
	// 	console.log('[notify] resolving shift leader for shift:', r.weeklyShiftId)

	// 	const leader = await db
	// 		.select({
	// 			email: user.email,
	// 		})
	// 		.from(shiftAssignments)
	// 		.innerJoin(
	// 			shiftRecurrences,
	// 			eq(shiftAssignments.shiftRecurrenceId, shiftRecurrences.id)
	// 		)
	// 		.innerJoin(user, eq(shiftAssignments.userId, user.id))
	// 		.where(
	// 			and(
	// 				eq(shiftRecurrences.shiftId, r.weeklyShiftId),
	// 				eq(shiftAssignments.assignmentRole, 'shift_lead'),
	// 				eq(shiftAssignments.isPrimary, true)
	// 			)
	// 		)
	// 		.limit(1)

	// 	shiftLeaderEmail = leader[0]?.email ?? null
	// 	console.log('[notify] shift leader email:', shiftLeaderEmail)
	// }

	const shiftLeaderStaff: StaffRecipient[] = []

	if (r.weeklyShiftId) {
		const leaders = await db
			.select({
				name: user.name,
				email: user.email,
			})
			.from(shiftAssignments)
			.innerJoin(
				shiftRecurrences,
				eq(shiftAssignments.shiftRecurrenceId, shiftRecurrences.id)
			)
			.innerJoin(user, eq(shiftAssignments.userId, user.id))
			.where(
				and(
					eq(shiftRecurrences.shiftId, r.weeklyShiftId),
					eq(shiftAssignments.assignmentRole, 'shift_lead'),
					eq(shiftAssignments.isPrimary, true)
				)
			)

		for (const leader of leaders) {
			if (leader.email) {
				shiftLeaderStaff.push({
					name: leader.name,
					email: leader.email,
					role: 'Shift Leader',
				})
			}
		}
	}

	const staffRecipients = dedupeByEmail([
		...directorStaff,
		...assistantStaff,
		...shiftLeaderStaff,
	])

	function dedupeByEmail(list: StaffRecipient[]) {
		return Array.from(new Map(list.map((s) => [s.email, s])).values())
	}
	return {
		reservationId: r.reservationId,
		locale: r.locale,
		submitterEmail: r.submitterEmail ?? null,
		staffRecipients,
		resourceName: r.resourceName ?? null,
		wardName: r.wardName ?? null,
		stakeName: r.stakeName ?? null,
		faithName: r.faithName ?? null,
	}
}

export function dedupeEmails(emails: Array<string | null | undefined>) {
	return Array.from(new Set(emails.filter(Boolean) as string[]))
}
