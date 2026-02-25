import { NextResponse } from 'next/server'
import { addDays, format, getDay } from 'date-fns'
import { and, eq, ne, or } from 'drizzle-orm'

import { db } from '@/db'
import { user } from '@/db/schema/tables/auth'
import {
	shiftAssignments,
	shiftRecurrences,
	weeklyShifts,
} from '@/db/schema/tables/shifts'
import {
	shiftSubRequests,
	shiftSubVolunteers,
	workerShiftAvailability,
} from '@/db/schema/tables/substitutes'

const LOOKAHEAD_DAYS = 365
const NOTE_PREFIX = 'E2E_SUBSTITUTE_FIXTURE'

type Scenario = 'accept-volunteer' | 'nomination'

function isAllowed(req: Request) {
	if (process.env.NODE_ENV === 'production') return false

	const secret = process.env.E2E_OUTBOX_SECRET
	if (!secret) return true

	return req.headers.get('x-e2e-secret') === secret
}

async function resolveRequester(params: URLSearchParams) {
	const userId = params.get('userId')
	const userLookup = params.get('userLookup')

	if (!userId && !userLookup) {
		throw new Error('Missing userId or userLookup query parameter.')
	}

	const requester = await db.query.user.findFirst({
		where: userLookup
			? or(eq(user.email, userLookup), eq(user.username, userLookup))
			: eq(user.id, userId ?? ''),
		columns: {
			id: true,
			email: true,
			username: true,
		},
	})

	if (!requester) {
		throw new Error('Requester user not found.')
	}

	return requester
}

async function pickRequesterShift(requesterUserId: string) {
	const existing = await db
		.select({
			shiftId: weeklyShifts.id,
			weekday: weeklyShifts.weekday,
			startTime: weeklyShifts.startTime,
			endTime: weeklyShifts.endTime,
			shiftRecurrenceId: shiftRecurrences.id,
		})
		.from(shiftAssignments)
		.innerJoin(
			shiftRecurrences,
			eq(shiftRecurrences.id, shiftAssignments.shiftRecurrenceId)
		)
		.innerJoin(weeklyShifts, eq(weeklyShifts.id, shiftRecurrences.shiftId))
		.where(
			and(
				eq(shiftAssignments.userId, requesterUserId),
				eq(weeklyShifts.isActive, true),
				eq(shiftRecurrences.isActive, true)
			)
		)
		.limit(1)
		.then((rows) => rows[0])

	if (existing) return existing

	const fallback = await db
		.select({
			shiftId: weeklyShifts.id,
			weekday: weeklyShifts.weekday,
			startTime: weeklyShifts.startTime,
			endTime: weeklyShifts.endTime,
			shiftRecurrenceId: shiftRecurrences.id,
		})
		.from(shiftRecurrences)
		.innerJoin(weeklyShifts, eq(weeklyShifts.id, shiftRecurrences.shiftId))
		.where(
			and(eq(weeklyShifts.isActive, true), eq(shiftRecurrences.isActive, true))
		)
		.limit(1)
		.then((rows) => rows[0])

	if (!fallback) {
		throw new Error('No active shift recurrence available for fixture creation.')
	}

	return fallback
}

async function findUnusedShiftDate(args: {
	requesterUserId: string
	shiftId: string
	weekday: number
}) {
	for (let i = 1; i <= LOOKAHEAD_DAYS; i += 1) {
		const candidate = addDays(new Date(), i)
		if (getDay(candidate) !== args.weekday) continue

		const date = format(candidate, 'yyyy-MM-dd')
		const existing = await db.query.shiftSubRequests.findFirst({
			where: and(
				eq(shiftSubRequests.requestedByUserId, args.requesterUserId),
				eq(shiftSubRequests.shiftId, args.shiftId),
				eq(shiftSubRequests.date, date)
			),
			columns: { id: true },
		})

		if (!existing) return date
	}

	throw new Error(
		`No unused shift date found in the next ${LOOKAHEAD_DAYS} days for requester/shift.`
	)
}

async function pickAnotherWorker(requesterUserId: string) {
	const row = await db
		.select({
			id: user.id,
			email: user.email,
			name: user.name,
		})
		.from(user)
		.where(
			and(
				eq(user.role, 'Worker'),
				ne(user.id, requesterUserId),
				ne(user.email, ''),
				eq(user.isActiveWorker, true)
			)
		)
		.limit(1)
		.then((rows) => rows[0])

	if (!row) {
		throw new Error('No secondary worker available for fixture.')
	}

	return row
}

export async function GET(req: Request) {
	if (!isAllowed(req)) {
		return new NextResponse('Not found', { status: 404 })
	}

	try {
		const { searchParams } = new URL(req.url)
		const scenario =
			(searchParams.get('scenario') as Scenario | null) ?? 'accept-volunteer'

		if (scenario !== 'accept-volunteer' && scenario !== 'nomination') {
			return NextResponse.json(
				{ error: 'Invalid scenario. Use accept-volunteer or nomination.' },
				{ status: 400 }
			)
		}

		const requester = await resolveRequester(searchParams)
		const shift = await pickRequesterShift(requester.id)
		const helperWorker = await pickAnotherWorker(requester.id)
		const date = await findUnusedShiftDate({
			requesterUserId: requester.id,
			shiftId: shift.shiftId,
			weekday: shift.weekday,
		})

		const [requestRow] = await db
			.insert(shiftSubRequests)
			.values({
				shiftId: shift.shiftId,
				shiftRecurrenceId: shift.shiftRecurrenceId,
				date,
				startTime: shift.startTime,
				endTime: shift.endTime,
				type: 'substitute',
				status:
					scenario === 'accept-volunteer'
						? 'awaiting_request_confirmation'
						: 'open',
				requestedByUserId: requester.id,
				notes: `${NOTE_PREFIX}:${scenario}:${Date.now()}`,
			})
			.returning({ id: shiftSubRequests.id })

		if (scenario === 'accept-volunteer') {
			await db.insert(shiftSubVolunteers).values({
				requestId: requestRow.id,
				volunteerUserId: helperWorker.id,
				status: 'offered',
			})
		} else {
			await db
				.insert(workerShiftAvailability)
				.values({
					userId: helperWorker.id,
					shiftId: shift.shiftId,
					shiftRecurrenceId: shift.shiftRecurrenceId,
					level: 'usually',
				})
				.onConflictDoUpdate({
					target: [
						workerShiftAvailability.userId,
						workerShiftAvailability.shiftId,
						workerShiftAvailability.shiftRecurrenceId,
					],
					set: {
						level: 'usually',
						updatedAt: new Date(),
					},
				})
		}

		return NextResponse.json({
			scenario,
			requestId: requestRow.id,
			requestUrl: `/en/substitutes/request/${requestRow.id}`,
			requesterUserId: requester.id,
			helperWorkerUserId: helperWorker.id,
			helperWorkerEmail: helperWorker.email,
			helperWorkerName: helperWorker.name,
			date,
			startTime: shift.startTime,
			endTime: shift.endTime,
		})
	} catch (error) {
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : 'Fixture failure' },
			{ status: 500 }
		)
	}
}
