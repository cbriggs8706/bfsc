// components/reports/TodayShiftCard.tsx

'use client'

import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { TodayShift } from '@/types/shift-report'
import { toAmPm } from '@/utils/time'

export function TodayShiftCard({ shift }: { shift: TodayShift }) {
	return (
		<Card>
			<CardHeader>
				<p className="font-semibold">
					{toAmPm(shift.startTime)} – {toAmPm(shift.endTime)}
				</p>
			</CardHeader>

			<CardContent className="space-y-4">
				{/* Consultants */}
				<div>
					<p className="text-sm font-medium mb-2">Consultants</p>

					<div className="flex gap-3 flex-wrap">
						{shift.consultants.length === 0 && (
							<p className="text-sm text-muted-foreground">
								No consultants checked in.
							</p>
						)}

						{shift.consultants.map((c) => (
							<div key={c.userId} className="flex items-center gap-2">
								<Avatar>
									<AvatarImage src={c.profileImageUrl ?? undefined} />
									<AvatarFallback>{c.fullName.charAt(0)}</AvatarFallback>
								</Avatar>
								<div>
									<p className="text-sm">{c.fullName}</p>
									<p className="text-xs text-muted-foreground">
										Arrived {new Date(c.arrivalAt).toLocaleTimeString()}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Patrons */}
				<div>
					<p className="text-sm font-medium mb-2">Patrons</p>

					{shift.patrons.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							No patrons during this shift.
						</p>
					) : (
						<ul className="space-y-1 text-sm">
							{shift.patrons.map((p) => (
								<li key={p.visitId} className="flex justify-between">
									<span>{p.fullName}</span>
									<span className="text-muted-foreground">
										{new Date(p.arrivedAt).toLocaleTimeString()}
									</span>
								</li>
							))}
						</ul>
					)}
				</div>
			</CardContent>
		</Card>
	)
}
