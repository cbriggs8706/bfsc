import { NextResponse } from 'next/server'
import { db } from '@/db'
import { session, user as userTable, verificationToken } from '@/db/schema'
import { and, eq, gt, or } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import {
	getClientIp,
	hashResetToken,
	throttleIncrement,
} from '@/lib/auth/password-reset-utils'

function normIdentifier(input: string) {
	return input.trim().toLowerCase()
}

export async function POST(req: Request) {
	try {
		const { identifier, code, password } = await req.json()

		if (!identifier || !code || !password) {
			return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
		}
		if (typeof password !== 'string' || password.length < 8) {
			return NextResponse.json({ error: 'Password too short' }, { status: 400 })
		}

		const ip = await getClientIp()
		const normalized = normIdentifier(identifier)

		const u = await db.query.user.findFirst({
			where: or(
				eq(userTable.email, normalized),
				eq(userTable.username, normalized)
			),
			columns: { id: true },
		})

		if (!u) {
			return NextResponse.json(
				{ error: 'No account found for that email/username.' },
				{ status: 404 }
			)
		}

		const attemptKey = `code:${u.id}:ip:${ip}`

		const vtIdentifier = `pwdreset:code:${u.id}`
		const tokenHash = hashResetToken(String(code))

		const vt = await db.query.verificationToken.findFirst({
			where: and(
				eq(verificationToken.identifier, vtIdentifier),
				eq(verificationToken.token, tokenHash),
				gt(verificationToken.expires, new Date())
			),
		})

		if (!vt) {
			const attempt = await throttleIncrement({
				kind: 'code_attempt',
				key: attemptKey,
				limit: 6,
				windowMs: 60 * 60 * 1000,
			})

			if (!attempt.ok) {
				return NextResponse.json(
					{
						error: 'Too many incorrect codes. Please ask staff for a new code.',
					},
					{ status: 429 }
				)
			}

			return NextResponse.json(
				{ error: 'Incorrect or expired code.' },
				{ status: 400 }
			)
		}

		const hashed = await bcrypt.hash(password, 10)

		await db.transaction(async (tx) => {
			await tx
				.update(userTable)
				.set({ passwordHash: hashed })
				.where(eq(userTable.id, u.id))

			// 🔐 log out everywhere
			await tx.delete(session).where(eq(session.userId, u.id))

			// 🔥 invalidate ALL staff codes for this user
			await tx
				.delete(verificationToken)
				.where(eq(verificationToken.identifier, vtIdentifier))
		})

		return NextResponse.json({ ok: true })
	} catch (err) {
		console.error(err)
		return NextResponse.json({ error: 'Reset failed' }, { status: 500 })
	}
}
