import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { eq, ilike } from 'drizzle-orm'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { user } from '@/db/schema/tables/auth'
import {
	kioskPeople,
	kioskShiftLogs,
	kioskVisitLogs,
} from '@/db/schema/tables/kiosk'
import { normalizeFullNameForStorage } from '@/lib/names'
import { getCenterTimeConfig } from '@/lib/time/center-time'
import { toUtcDateTimeInTz } from '@/utils/time'

const ADMIN_ROLES = ['Admin', 'Director'] as const
const WORKER_ROLES = [
	'Worker',
	'Shift Lead',
	'Assistant Director',
	'Director',
	'Admin',
] as const

type EntryInput = {
	time: string
	name: string
	onShift?: boolean
	selectedId?: string | null
	visitMeta?: {
		visitReason?: 'patron' | 'training' | 'group'
		partOfFaithGroup?: boolean | null
		faithGroupName?: string | null
		stakeName?: string | null
		wardName?: string | null
		peopleCameWithVisitor?: number | null
	} | null
}

type RequestBody = {
	date: string
	entries?: EntryInput[]
}

function isWorkerRole(role: string | null): boolean {
	return role !== null && WORKER_ROLES.includes(role as (typeof WORKER_ROLES)[number])
}

async function createKioskPersonFromUserRow(existingUser: {
	id: string
	name: string | null
	email: string | null
	role: string | null
}) {
	if (!existingUser.name) return null

	const [created] = await db
		.insert(kioskPeople)
		.values({
			fullName: normalizeFullNameForStorage(existingUser.name),
			email: existingUser.email,
			userId: existingUser.id,
			isWorkerCached: isWorkerRole(existingUser.role),
		})
		.returning({
			id: kioskPeople.id,
			fullName: kioskPeople.fullName,
			userId: kioskPeople.userId,
		})

	return created ?? null
}

async function resolveSelectedPerson(selectedId: string) {
	if (selectedId.startsWith('user:')) {
		const userId = selectedId.slice('user:'.length)

		const existingKiosk = await db.query.kioskPeople.findFirst({
			where: eq(kioskPeople.userId, userId),
		})
		if (existingKiosk) {
			return {
				personId: existingKiosk.id,
				userId: existingKiosk.userId,
				fullName: existingKiosk.fullName,
			}
		}

		const existingUser = await db.query.user.findFirst({
			where: eq(user.id, userId),
		})
		if (!existingUser?.name) return null

		const created = await createKioskPersonFromUserRow(existingUser)
		if (!created) return null

		return {
			personId: created.id,
			userId: created.userId,
			fullName: created.fullName,
		}
	}

	const existingKiosk = await db.query.kioskPeople.findFirst({
		where: eq(kioskPeople.id, selectedId),
	})
	if (!existingKiosk) return null

	return {
		personId: existingKiosk.id,
		userId: existingKiosk.userId,
		fullName: existingKiosk.fullName,
	}
}

async function resolveTypedPerson(rawName: string) {
	const normalizedName = normalizeFullNameForStorage(rawName)

	const kioskMatches = await db
		.select({
			id: kioskPeople.id,
			fullName: kioskPeople.fullName,
			userId: kioskPeople.userId,
		})
		.from(kioskPeople)
		.where(ilike(kioskPeople.fullName, normalizedName))
		.limit(2)

	if (kioskMatches.length === 1) {
		return {
			personId: kioskMatches[0].id,
			userId: kioskMatches[0].userId,
			fullName: kioskMatches[0].fullName,
		}
	}

	if (kioskMatches.length === 0) {
		const userMatches = await db
			.select({
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
			})
			.from(user)
			.where(ilike(user.name, normalizedName))
			.limit(2)

		if (userMatches.length === 1 && userMatches[0].name) {
			const existingKiosk = await db.query.kioskPeople.findFirst({
				where: eq(kioskPeople.userId, userMatches[0].id),
			})

			if (existingKiosk) {
				return {
					personId: existingKiosk.id,
					userId: existingKiosk.userId,
					fullName: existingKiosk.fullName,
				}
			}

			const createdFromUser = await createKioskPersonFromUserRow(userMatches[0])
			if (createdFromUser) {
				return {
					personId: createdFromUser.id,
					userId: createdFromUser.userId,
					fullName: createdFromUser.fullName,
				}
			}
		}
	}

	const [created] = await db
		.insert(kioskPeople)
		.values({
			fullName: normalizedName,
			isWorkerCached: false,
		})
		.returning({
			id: kioskPeople.id,
			fullName: kioskPeople.fullName,
			userId: kioskPeople.userId,
		})

	return {
		personId: created.id,
		userId: created.userId,
		fullName: created.fullName,
	}
}

export async function POST(request: Request) {
	const session = await getServerSession(authOptions)
	if (!session?.user || !ADMIN_ROLES.includes(session.user.role as 'Admin' | 'Director')) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	try {
		const body = (await request.json()) as RequestBody
		const date = typeof body.date === 'string' ? body.date.trim() : ''
		const entries = Array.isArray(body.entries) ? body.entries : []

		if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
			return NextResponse.json({ error: 'A valid date is required.' }, { status: 400 })
		}

		const cleanedEntries = entries
			.map((entry) => ({
				time: typeof entry.time === 'string' ? entry.time.trim() : '',
				name: typeof entry.name === 'string' ? entry.name.trim() : '',
				onShift: Boolean(entry.onShift),
				selectedId:
					typeof entry.selectedId === 'string' ? entry.selectedId.trim() : null,
				visitMeta:
					entry.visitMeta && typeof entry.visitMeta === 'object'
						? {
								visitReason:
									entry.visitMeta.visitReason === 'group' ||
									entry.visitMeta.visitReason === 'training'
										? entry.visitMeta.visitReason
										: 'patron',
								partOfFaithGroup:
									typeof entry.visitMeta.partOfFaithGroup === 'boolean'
										? entry.visitMeta.partOfFaithGroup
										: null,
								faithGroupName:
									typeof entry.visitMeta.faithGroupName === 'string'
										? entry.visitMeta.faithGroupName.trim() || null
										: null,
								stakeName:
									typeof entry.visitMeta.stakeName === 'string'
										? entry.visitMeta.stakeName.trim() || null
										: null,
								wardName:
									typeof entry.visitMeta.wardName === 'string'
										? entry.visitMeta.wardName.trim() || null
										: null,
								peopleCameWithVisitor:
									typeof entry.visitMeta.peopleCameWithVisitor === 'number'
										? Math.max(
												0,
												Math.floor(entry.visitMeta.peopleCameWithVisitor)
											)
										: 0,
							}
						: null,
			}))
			.filter((entry) => entry.time && entry.name)

		if (cleanedEntries.length === 0) {
			return NextResponse.json(
				{ error: 'Add at least one entry with both a time and a name.' },
				{ status: 400 }
			)
		}

		const centerTime = await getCenterTimeConfig()
		const createdVisits: Array<{
			id: string
			personId: string
			fullName: string
			createdAt: string
			kind: 'visit' | 'shift'
		}> = []

		for (const entry of cleanedEntries) {
			if (!/^\d{2}:\d{2}$/.test(entry.time)) {
				return NextResponse.json(
					{ error: `Invalid time for ${entry.name}.` },
					{ status: 400 }
				)
			}

			const resolvedPerson = entry.selectedId
				? await resolveSelectedPerson(entry.selectedId)
				: await resolveTypedPerson(entry.name)

			if (!resolvedPerson) {
				return NextResponse.json(
					{ error: `Could not resolve ${entry.name} to a kiosk person.` },
					{ status: 400 }
				)
			}

			const occurredAt = toUtcDateTimeInTz(date, entry.time, centerTime.timeZone)
			const notes =
				entry.visitMeta && entry.visitMeta.visitReason !== 'patron'
					? JSON.stringify({
							visitReason: entry.visitMeta.visitReason,
							partOfFaithGroup: entry.visitMeta.partOfFaithGroup ?? null,
							faithGroupName: entry.visitMeta.faithGroupName ?? null,
							stakeName: entry.visitMeta.stakeName ?? null,
							wardName: entry.visitMeta.wardName ?? null,
							peopleCameWithVisitor:
								entry.visitMeta.peopleCameWithVisitor ?? 0,
					  })
					: null

			if (entry.onShift) {
				if (!resolvedPerson.userId) {
					return NextResponse.json(
						{
							error: `${entry.name} must be linked to an existing user before it can be saved as on shift.`,
						},
						{ status: 400 }
					)
				}

				const [shift] = await db
					.insert(kioskShiftLogs)
					.values({
						personId: resolvedPerson.personId,
						userId: resolvedPerson.userId,
						arrivalAt: occurredAt,
						expectedDepartureAt: occurredAt,
						actualDepartureAt: occurredAt,
					})
					.returning({
						id: kioskShiftLogs.id,
						personId: kioskShiftLogs.personId,
						arrivalAt: kioskShiftLogs.arrivalAt,
					})

				createdVisits.push({
					id: shift.id,
					personId: shift.personId,
					fullName: resolvedPerson.fullName,
					createdAt: shift.arrivalAt.toISOString(),
					kind: 'shift',
				})
				continue
			}

			const [visit] = await db
				.insert(kioskVisitLogs)
				.values({
					personId: resolvedPerson.personId,
					userId: resolvedPerson.userId,
					mailingListOptIn: false,
					createdAt: occurredAt,
					departedAt: occurredAt,
					notes,
				})
				.returning({
					id: kioskVisitLogs.id,
					personId: kioskVisitLogs.personId,
					createdAt: kioskVisitLogs.createdAt,
				})

			createdVisits.push({
				id: visit.id,
				personId: visit.personId,
				fullName: resolvedPerson.fullName,
				createdAt: visit.createdAt.toISOString(),
				kind: 'visit',
			})
		}

		return NextResponse.json({ count: createdVisits.length, visits: createdVisits })
	} catch (error) {
		console.error('Error creating historical kiosk visits', error)
		return NextResponse.json(
			{ error: 'Failed to create historical kiosk visits.' },
			{ status: 500 }
		)
	}
}
