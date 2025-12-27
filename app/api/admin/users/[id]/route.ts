// app/api/admin/users/[id]/route.ts
import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { user } from '@/db/schema/tables/auth'

const ALLOWED_ROLES = [
	'Admin',
	'Director',
	'Assistant Director',
	'Worker',
	'Shift Lead',
	'Patron',
] as const
type AllowedRole = (typeof ALLOWED_ROLES)[number]

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params
		// console.log('Updating user with id:', id)

		const body = await request.json()

		const updates = {
			name: body.name ?? null,
			email: body.email ?? null,
			username: body.username ?? null,
			role: body.role ?? null,
		}

		const [updated] = await db
			.update(user)
			.set(updates)
			.where(eq(user.id, id))
			.returning({
				id: user.id,
				name: user.name,
				email: user.email,
				username: user.username,
				role: user.role,
			})

		if (!updated) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 })
		}

		return NextResponse.json(updated)
	} catch (err) {
		console.error('Error updating user', err)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}

export async function DELETE(
	req: Request,
	context: { params: Promise<{ id: string }> }
) {
	const { id } = await context.params

	try {
		await db.delete(user).where(eq(user.id, id))
		return NextResponse.json({ success: true })
	} catch (err) {
		console.error('Error deleting user', err)
		return NextResponse.json({ error: 'Server error' }, { status: 500 })
	}
}
