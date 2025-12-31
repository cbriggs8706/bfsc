// lib/auth/password-reset-utils.ts
import crypto from 'crypto'
import { headers } from 'next/headers'
import { and, eq, gte, lte } from 'drizzle-orm'
import { db } from '@/db'
import { passwordResetThrottle } from '@/db/schema'

const SECRET = process.env.PASSWORD_RESET_SECRET
if (!SECRET) throw new Error('Missing PASSWORD_RESET_SECRET')

export function hashResetToken(raw: string) {
	return crypto.createHash('sha256').update(`${raw}:${SECRET}`).digest('hex')
}

export function randomTokenUrlSafe(bytes = 32) {
	return crypto.randomBytes(bytes).toString('base64url')
}

/**
 * Next.js 15+ headers() is async
 */
export async function getClientIp() {
	const h = await headers()

	const xff = h.get('x-forwarded-for')
	if (xff) return xff.split(',')[0].trim()

	return h.get('x-real-ip') ?? 'unknown'
}

type ThrottleKind = 'request' | 'code_attempt'

export async function throttleIncrement(opts: {
	kind: ThrottleKind
	key: string
	limit: number
	windowMs: number
}) {
	const now = new Date()
	const windowStart = now
	const windowEnds = new Date(now.getTime() + opts.windowMs)

	const row = await db.query.passwordResetThrottle.findFirst({
		where: and(
			eq(passwordResetThrottle.kind, opts.kind),
			eq(passwordResetThrottle.key, opts.key),
			gte(passwordResetThrottle.windowEnds, now),
			lte(passwordResetThrottle.windowStart, now)
		),
	})

	if (!row) {
		await db.insert(passwordResetThrottle).values({
			kind: opts.kind,
			key: opts.key,
			count: 1,
			windowStart,
			windowEnds,
		})
		return { ok: true as const, remaining: opts.limit - 1 }
	}

	if (row.count >= opts.limit) {
		return { ok: false as const, remaining: 0 }
	}

	await db
		.update(passwordResetThrottle)
		.set({ count: row.count + 1 })
		.where(eq(passwordResetThrottle.id, row.id))

	return {
		ok: true as const,
		remaining: Math.max(0, opts.limit - (row.count + 1)),
	}
}
