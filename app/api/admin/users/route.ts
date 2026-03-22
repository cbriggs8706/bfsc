import { NextResponse } from 'next/server'
import { db } from '@/db'
import { account, user } from '@/db/schema/tables/auth'
import bcrypt from 'bcryptjs'

const TEMP_PASSWORD = 'Password1234'

const ROLES = [
	'Admin',
	'Director',
	'Assistant Director',
	'Worker',
	'Shift Lead',
	'Patron',
] as const

export async function POST(request: Request) {
	try {
		const body = await request.json()
		const name = typeof body.name === 'string' ? body.name.trim() : ''
		const email = typeof body.email === 'string' ? body.email.trim() : ''
		const username =
			typeof body.username === 'string' ? body.username.trim() : ''
		const role = body.role

		if (!name && !email) {
			return NextResponse.json(
				{ error: 'Name or email is required' },
				{ status: 400 }
			)
		}

		if (role && !ROLES.includes(role)) {
			return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
		}

		const passwordHash = await bcrypt.hash(TEMP_PASSWORD, 10)

		const [created] = await db
			.insert(user)
			.values({
				name: name || null,
				email: email || null,
				username: username || null,
				passwordHash,
				mustResetPassword: true,
				role: role ?? 'Patron',
			})
			.returning({
				id: user.id,
				name: user.name,
				email: user.email,
				username: user.username,
				role: user.role,
			})

		await db.insert(account).values({
			userId: created.id,
			provider: 'credentials',
			providerAccountId: created.id,
			type: 'credentials',
		})

		return NextResponse.json(created)
	} catch (err) {
		console.error('Error creating user:', err)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}
