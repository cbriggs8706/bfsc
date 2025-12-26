'use client'

import { useState, useTransition } from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { updateTimeFormat } from '@/lib/actions/app-settings'
import { TimeFormat } from '@/types/shifts'

type Props = {
	initialFormat: TimeFormat
}

export function TimeFormatSettings({ initialFormat }: Props) {
	const [value, setValue] = useState<TimeFormat>(initialFormat)
	const [pending, startTransition] = useTransition()

	const preview = format(new Date(), value)

	function save() {
		startTransition(async () => {
			await updateTimeFormat(value)
		})
	}

	return (
		<Card className="p-4 space-y-3">
			<h2 className="text-lg font-semibold">Time Format</h2>

			<p className="text-sm text-muted-foreground">
				Choose how times are displayed throughout the system.
			</p>

			<div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
				<Select value={value} onValueChange={(v) => setValue(v as TimeFormat)}>
					<SelectTrigger className="w-[220px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="h:mm a">4:00 PM</SelectItem>
						<SelectItem value="hh:mm a">04:00 PM</SelectItem>
						<SelectItem value="H:mm">16:00</SelectItem>
						<SelectItem value="HH:mm">16:00</SelectItem>
					</SelectContent>
				</Select>

				<div className="text-sm text-muted-foreground">
					Preview: <span className="font-medium">{preview}</span>
				</div>

				<Button onClick={save} disabled={pending}>
					{pending ? 'Saving…' : 'Save'}
				</Button>
			</div>
		</Card>
	)
}
