'use client'

import { useTransition } from 'react'
import { updateCheckpointContribution } from '@/lib/actions/projects/checkpoints'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'

type Row = {
	id: string
	userName: string | null
	minutesSpent: number
	createdAt: Date
}

type Props = {
	locale: string
	rows: Row[]
}

export function AdminCheckpointContributions({ locale, rows }: Props) {
	const [isPending, startTransition] = useTransition()

	const totalMinutes = rows.reduce((sum, r) => sum + r.minutesSpent, 0)

	const totalHours = (totalMinutes / 60).toFixed(2)

	return (
		<Card className="">
			{/* ───────── Header ───────── */}
			<CardHeader>
				{' '}
				<div className="flex items-center justify-between">
					<h3 className="font-semibold">Time Contributions</h3>

					<div className="text-sm text-muted-foreground">
						Total: <span className="font-medium">{totalHours}</span> hrs
					</div>
				</div>
				<div className="text-sm text-muted-foreground">
					Edits to the minutes below will be made in realtime, no save required.
				</div>
			</CardHeader>

			<CardContent>
				{/* ───────── Table ───────── */}
				<Table className="w-full text-sm">
					<TableHeader>
						<TableRow className="text-muted-foreground border-b">
							<TableHead className="text-left py-1">User</TableHead>
							<TableHead className="text-left py-1">Minutes</TableHead>
							<TableHead className="text-left py-1">Date</TableHead>
						</TableRow>
					</TableHeader>

					<TableBody>
						{rows.map((r) => (
							<TableRow key={r.id} className="border-b last:border-0">
								<TableCell className="py-1">
									{r.userName ?? 'Unknown'}
								</TableCell>

								<TableCell className="py-1">
									<Input
										type="number"
										defaultValue={r.minutesSpent}
										className="w-24 h-8"
										onBlur={(e) => {
											const minutes = Number(e.target.value)
											if (minutes === r.minutesSpent) return

											startTransition(() => {
												updateCheckpointContribution(locale, {
													contributionId: r.id,
													minutesSpent: minutes,
												})
											})
										}}
									/>
								</TableCell>

								<TableCell className="py-1 text-muted-foreground">
									{r.createdAt.toLocaleDateString()}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	)
}
