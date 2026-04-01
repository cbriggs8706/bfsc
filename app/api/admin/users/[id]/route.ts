// app/api/admin/users/[id]/route.ts
import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { user } from '@/db/schema/tables/auth'
import { kioskPeople } from '@/db/schema/tables/kiosk'
import { isWorkerRole } from '@/lib/is-worker-role'

const ALLOWED_ROLES = [
	'Admin',
	'Director',
	'Assistant Director',
	'Worker',
	'Shift Lead',
	'Patron',
] as const

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params
		// console.log('Updating user with id:', id)

		const body = await request.json()
		const role = body.role ?? null

		if (role && !ALLOWED_ROLES.includes(role)) {
			return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
		}

		const updates = {
			name:
				typeof body.name === 'string' ? body.name.trim() || null : body.name ?? null,
			email:
				typeof body.email === 'string'
					? body.email.trim() || null
					: body.email ?? null,
			username:
				typeof body.username === 'string'
					? body.username.trim() || null
					: body.username ?? null,
			role,
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

		await db
			.update(kioskPeople)
			.set({
				isWorkerCached: isWorkerRole(updated.role),
				updatedAt: new Date(),
			})
			.where(eq(kioskPeople.userId, updated.id))

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
