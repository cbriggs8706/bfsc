// app/[locale]/admin/center/faiths/page.tsx
import { FaithAdminManager } from '@/components/admin/faiths/FaithAdminManager'
import { getFaithTree } from '@/db/queries/faiths'

export default async function FaithsPage() {
	const faiths = await getFaithTree()

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">Faiths</h1>
				<p className="text-sm text-muted-foreground">
					These will be used as optional fields on user forms.
				</p>
			</div>
			<FaithAdminManager initialFaiths={faiths} />
		</div>
	)
}
