// components/reports/ShiftReportCard.tsx
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import type { ShiftReportItem } from '@/types/shift-report'

export function ShiftReportCard({ shift }: { shift: ShiftReportItem }) {
	const { consultant, patrons } = shift

	const endTime = consultant.actualDepartureAt ?? consultant.expectedDepartureAt

	return (
		<Card>
			<CardHeader className="flex flex-row items-center gap-4">
				<Avatar>
					<AvatarImage src={consultant.profileImageUrl ?? undefined} />
					<AvatarFallback>{consultant.fullName.charAt(0)}</AvatarFallback>
				</Avatar>

				<div>
					<p className="font-semibold">{consultant.fullName}</p>
					<p className="text-sm text-muted-foreground">
						{new Date(consultant.arrivalAt).toLocaleTimeString()} –{' '}
						{new Date(endTime).toLocaleTimeString()}
					</p>
				</div>
			</CardHeader>

			<CardContent>
				{patrons.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						No patrons during this shift.
					</p>
				) : (
					<ul className="space-y-2">
						{patrons.map((p) => (
							<li
								key={`${p.personId}-${p.signedInAt}`}
								className="flex justify-between text-sm"
							>
								<span>{p.fullName}</span>
								<span className="text-muted-foreground">
									{new Date(p.signedInAt).toLocaleTimeString()}
									{' — '}
									{p.purposeName ?? 'General'}
								</span>
							</li>
						))}
					</ul>
				)}
			</CardContent>
		</Card>
	)
}
