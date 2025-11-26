// app/api/auth/register/route.ts
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/db/client'
import { user } from '@/db/schema/tables/auth'
import { eq } from 'drizzle-orm'

export async function POST(req: Request) {
	try {
		const { username, email, password } = await req.json()

		if (!username || !email || !password) {
			return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
		}

		// ✅ Correct table reference
		const existing = await db.query.user.findFirst({
			where: eq(user.email, email),
		})

		if (existing) {
			return NextResponse.json(
				{ error: 'Email already registered' },
				{ status: 409 }
			)
		}

		const hashed = await bcrypt.hash(password, 10)

		// ✅ Correct insert table reference
		await db.insert(user).values({
			username,
			email,
			passwordHash: hashed,
		})

		return NextResponse.json({ success: true })
	} catch (err) {
		console.error('Register error:', err)
		return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
	}
}
