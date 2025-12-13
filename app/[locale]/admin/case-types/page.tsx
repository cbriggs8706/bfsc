// app/[locale]/admin/case-types/page.tsx
import { AdminCaseTypes } from '@/components/cases/AdminCaseTypes'
import { db } from '@/db'
import { caseTypes } from '@/db'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function CaseTypesAdminPage() {
	const user = await getCurrentUser()
	if (!user || user.role !== 'Admin') redirect('/en/dashboard')

	const types = await db.select().from(caseTypes)

	return <AdminCaseTypes initialTypes={types} />
}
