// app/[locale]/admin/center/callings/page.tsx
import { CallingsManager } from '@/components/admin/faiths/Callings'
import { getCallings } from '@/db/queries/faiths'

export default async function CallingsPage() {
	const callings = await getCallings()

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-semibold">Callings</h1>
			<CallingsManager initialCallings={callings} />
		</div>
	)
}
