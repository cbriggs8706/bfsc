import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { siteSetting } from '@/db/schema/tables/classes'

type ReservationStatus = 'pending' | 'confirmed' | 'denied' | 'cancelled'

type PrintSettings = {
	month: string
	includeClasses: boolean
	includeReservations: boolean
	classPresenter: string
	classLocation: string
	reservationResource: string
	reservationStatuses: ReservationStatus[]
}

function getSettingKey(userId: string) {
	return `calendar.print.settings.${userId}`
}

function sanitizeSettings(raw: unknown): PrintSettings | null {
	if (!raw || typeof raw !== 'object') return null
	const settings = raw as Partial<PrintSettings>

	const month =
		typeof settings.month === 'string' && /^\d{4}-\d{2}$/.test(settings.month)
			? settings.month
			: null
	if (!month) return null

	const statuses = Array.isArray(settings.reservationStatuses)
		? settings.reservationStatuses.filter(
				(status): status is ReservationStatus =>
					status === 'pending' ||
					status === 'confirmed' ||
					status === 'denied' ||
					status === 'cancelled'
		  )
		: []

	return {
		month,
		includeClasses: Boolean(settings.includeClasses),
		includeReservations: Boolean(settings.includeReservations),
		classPresenter:
			typeof settings.classPresenter === 'string'
				? settings.classPresenter
				: 'all',
		classLocation:
			typeof settings.classLocation === 'string' ? settings.classLocation : 'all',
		reservationResource:
			typeof settings.reservationResource === 'string'
				? settings.reservationResource
				: 'all',
		reservationStatuses: statuses.length > 0 ? statuses : ['confirmed'],
	}
}

export async function GET() {
	const session = await getServerSession(authOptions)
	if (!session?.user?.id) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const key = getSettingKey(session.user.id)
	const row = await db.query.siteSetting.findFirst({
		where: eq(siteSetting.key, key),
		columns: { value: true },
	})

	return NextResponse.json({ settings: row?.value ?? null })
}

export async function POST(req: Request) {
	const session = await getServerSession(authOptions)
	if (!session?.user?.id) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const payload = await req.json().catch(() => null)
	const settings = sanitizeSettings(payload)
	if (!settings) {
		return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
	}

	const key = getSettingKey(session.user.id)
	await db
		.insert(siteSetting)
		.values({
			key,
			value: settings,
			updatedAt: new Date(),
		})
		.onConflictDoUpdate({
			target: siteSetting.key,
			set: { value: settings, updatedAt: new Date() },
		})

	return NextResponse.json({ ok: true })
}
