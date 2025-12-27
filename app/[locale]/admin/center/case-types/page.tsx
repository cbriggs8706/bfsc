// app/[locale]/admin/center/case-types/page.tsx
import { AdminCaseTypes } from '@/components/cases/AdminCaseTypes'
import { db } from '@/db'
import { caseTypes } from '@/db'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function CaseTypesPage() {
	const user = await getCurrentUser()
	if (!user || user.role !== 'Admin') redirect('/en/dashboard')

	const types = await db.select().from(caseTypes)

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">Case Types</h1>
				<p className="text-sm text-muted-foreground">
					These will be used to define cases as people create them.
				</p>
			</div>
			<AdminCaseTypes initialTypes={types} />
		</div>
	)
}
