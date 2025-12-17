// app/[locale]/admin/center/faiths/page.tsx
import { FaithAdminManager } from '@/components/admin/faiths/FaithAdminManager'
import { getFaithTree } from '@/db/queries/faiths'

export default async function FaithsPage() {
	const faiths = await getFaithTree()

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-semibold">Faiths</h1>
			<FaithAdminManager initialFaiths={faiths} />
		</div>
	)
}
