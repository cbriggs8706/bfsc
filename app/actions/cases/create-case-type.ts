// app/actions/cases/create-case-type.ts
'use server'

import { db } from '@/db'
import { caseTypes } from '@/db'
import { getCurrentUser } from '@/lib/auth'

export async function createCaseType(input: { name: string; icon?: string }) {
	const user = await getCurrentUser()
	if (!user || user.role !== 'Admin') {
		throw new Error('Forbidden')
	}

	const [created] = await db
		.insert(caseTypes)
		.values({
			name: input.name,
			icon: input.icon,
			isActive: true,
		})
		.returning()

	return created
}
