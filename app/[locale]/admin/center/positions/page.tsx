// app/[locale]/admin/center/positions/page.tsx
import { PositionsManager } from '@/components/admin/faiths/Positions'
import { getPositions } from '@/db/queries/faiths'

export default async function PositionsPage() {
	const positions = await getPositions()

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-semibold">Positions</h1>
			<PositionsManager initialPositions={positions} />
		</div>
	)
}
