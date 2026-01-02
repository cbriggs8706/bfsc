// components/shifts/CreateSubstituteRequest.tsx

'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toAmPm } from '@/utils/time'

type Props = {
	shift: {
		startTime: string
		endTime: string
		recurrenceLabel: string
	}
	date: string
	currentUserId: string
}

//CORRECTED TIMEZONES

export function CreateSubstituteRequestClient({ shift, date }: Props) {
	return (
		<Card>
			<CardContent className="space-y-4 p-4">
				<div className="text-sm">
					<div className="font-medium">
						{date} · {toAmPm(shift.startTime)}–{toAmPm(shift.endTime)}
					</div>
					<div className="text-xs text-muted-foreground">
						{shift.recurrenceLabel}
					</div>
				</div>

				<Button>Create request</Button>
			</CardContent>
		</Card>
	)
}
