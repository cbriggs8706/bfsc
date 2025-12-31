import { NextResponse } from 'next/server'
import { db } from '@/db'
import { session, user as userTable, verificationToken } from '@/db/schema'
import { and, eq, gt } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { hashResetToken } from '@/lib/auth/password-reset-utils'

export async function POST(req: Request) {
	try {
		const { uid, token, password } = await req.json()

		if (!uid || !token || !password) {
			return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
		}

		if (typeof password !== 'string' || password.length < 8) {
			return NextResponse.json({ error: 'Password too short' }, { status: 400 })
		}

		const identifier = `pwdreset:link:${uid}`
		const tokenHash = hashResetToken(token)
		// const now = new Date()

		// console.log('🔍 PASSWORD RESET VERIFY ATTEMPT')
		// console.log('UID FROM URL:', uid)
		// console.log('IDENTIFIER LOOKUP:', identifier)
		// console.log('RAW TOKEN FROM URL:', token)
		// console.log('HASH FROM URL TOKEN:', tokenHash)
		// console.log('NOW:', now)

		const vt = await db.query.verificationToken.findFirst({
			where: and(
				eq(verificationToken.identifier, identifier),
				eq(verificationToken.token, tokenHash),
				gt(verificationToken.expires, new Date())
			),
		})

		// console.log('TOKEN ROW FOUND:', vt)

		if (!vt) {
			return NextResponse.json(
				{ error: 'Invalid or expired link.' },
				{ status: 400 }
			)
		}

		const hashed = await bcrypt.hash(password, 10)

		await db.transaction(async (tx) => {
			await tx
				.update(userTable)
				.set({ passwordHash: hashed })
				.where(eq(userTable.id, uid))

			// 🔐 log out everywhere
			await tx.delete(session).where(eq(session.userId, uid))

			// 🔥 invalidate all reset links
			await tx
				.delete(verificationToken)
				.where(eq(verificationToken.identifier, identifier))
		})

		return NextResponse.json({ ok: true })
	} catch (err) {
		console.error(err)
		return NextResponse.json({ error: 'Reset failed' }, { status: 500 })
	}
}
