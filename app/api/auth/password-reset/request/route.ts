import { NextResponse } from 'next/server'
import { db } from '@/db'
import { user as userTable, verificationToken } from '@/db/schema'
import { or, eq } from 'drizzle-orm'
import {
	getClientIp,
	hashResetToken,
	randomTokenUrlSafe,
	throttleIncrement,
} from '@/lib/auth/password-reset-utils'
import { sendPasswordResetEmail } from '@/lib/email/send-password-reset-email'

function normIdentifier(input: string) {
	return input.trim().toLowerCase()
}

export async function POST(req: Request) {
	try {
		const { identifier, locale } = await req.json()

		if (!identifier || typeof identifier !== 'string') {
			return NextResponse.json({ error: 'Missing identifier' }, { status: 400 })
		}

		const normalized = normIdentifier(identifier)
		const ip = await getClientIp()

		// Identifier throttle
		const identThrottle = await throttleIncrement({
			kind: 'request',
			key: `ident:${normalized}`,
			limit: 5,
			windowMs: 60 * 60 * 1000,
		})
		if (!identThrottle.ok) {
			return NextResponse.json(
				{ error: 'Too many reset requests. Please try again later.' },
				{ status: 429 }
			)
		}

		// IP throttle
		const ipThrottle = await throttleIncrement({
			kind: 'request',
			key: `ip:${ip}`,
			limit: 100,
			windowMs: 24 * 60 * 60 * 1000,
		})
		if (!ipThrottle.ok) {
			return NextResponse.json(
				{ error: 'Too many requests from this network today.' },
				{ status: 429 }
			)
		}

		const u = await db.query.user.findFirst({
			where: or(
				eq(userTable.email, normalized),
				eq(userTable.username, normalized)
			),
			columns: { id: true, email: true },
		})

		if (!u || !u.email) {
			return NextResponse.json(
				{ error: 'No account found for that email/username.' },
				{ status: 404 }
			)
		}

		const rawToken = randomTokenUrlSafe(32)
		const tokenHash = hashResetToken(rawToken)
		const expires = new Date(Date.now() + 60 * 60 * 1000)
		// const vtIdentifier = `pwdreset:link:${u.id}`

		// console.log('🔐 PASSWORD RESET TOKEN CREATED')
		// console.log('UID:', u.id)
		// console.log('IDENTIFIER:', vtIdentifier)
		// console.log('RAW TOKEN (EMAIL):', rawToken)
		// console.log('HASH STORED:', tokenHash)
		// console.log('EXPIRES:', expires)

		await db.insert(verificationToken).values({
			identifier: `pwdreset:link:${u.id}`,
			token: tokenHash,
			expires,
		})

		const base = process.env.APP_BASE_URL
		if (!base) throw new Error('Missing APP_BASE_URL')

		const safeLocale = typeof locale === 'string' && locale ? locale : 'en'
		const resetUrl = `${base}/${safeLocale}/reset-password?uid=${encodeURIComponent(
			u.id
		)}&token=${encodeURIComponent(rawToken)}`

		// ✅ Single source of truth for email sending
		await sendPasswordResetEmail({
			email: u.email,
			resetUrl,
			locale: safeLocale,
		})

		return NextResponse.json({ ok: true })
	} catch (err) {
		console.error(err)
		return NextResponse.json({ error: 'Request failed' }, { status: 500 })
	}
}
