// app/actions/cases/update-case-type.ts

'use server'

import { db } from '@/db'
import { caseTypes } from '@/db'
import { eq } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth'

export async function updateCaseType(
	id: string,
	input: {
		name: string
		icon?: string
		isActive: boolean
	}
) {
	const user = await getCurrentUser()
	if (!user || user.role !== 'Admin') {
		throw new Error('Forbidden')
	}

	await db
		.update(caseTypes)
		.set({
			name: input.name,
			icon: input.icon,
			isActive: input.isActive,
		})
		.where(eq(caseTypes.id, id))
}
