import { NextResponse } from 'next/server'
import { db } from '@/db'
import { user } from '@/db/schema/tables/auth'

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

		const [created] = await db
			.insert(user)
			.values({
				name: name || null,
				email: email || null,
				username: username || null,
				role: role ?? 'Patron',
			})
			.returning({
				id: user.id,
				name: user.name,
				email: user.email,
				username: user.username,
				role: user.role,
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
