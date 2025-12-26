// components/resources/ReservationForm.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { AssistanceLevel, ResourceOption, TimeSlot } from '@/types/resource'
import { useAvailability } from '@/hooks/use-availability'
import { createReservation } from '@/app/actions/resource/create-reservation'
import { toAmPm } from '@/utils/time'
import { Card } from '../ui/card'

type Props = {
	resources: ResourceOption[]
}

export function ReservationForm({ resources }: Props) {
	const [resourceId, setResourceId] = useState<string | null>(null)
	const [date, setDate] = useState<string | null>(null)
	const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
	const [closedAck, setClosedAck] = useState(false)
	const [notes, setNotes] = useState('')
	const [submitting, setSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState(false)
	const [attendeeCount, setAttendeeCount] = useState<number>(1)
	const [assistanceLevel, setAssistanceLevel] =
		useState<AssistanceLevel>('none')

	const { data, loading } = useAvailability(resourceId, date)

	async function handleSubmit() {
		if (!resourceId || !date || !selectedSlot) return

		setSubmitting(true)
		setError(null)

		const startTime = new Date(`${date}T${selectedSlot.startTime}:00Z`)

		const result = await createReservation({
			resourceId,
			startTime,
			isClosedDayRequest: closedAck,
			notes,
			attendeeCount,
			assistanceLevel,
		})

		if (!result.success) {
			setError(result.error)
		} else {
			setSuccess(true)
		}

		setSubmitting(false)
	}

	if (success) {
		return (
			<Card className="p-6 text-center">
				<h2 className="text-lg font-semibold">Request submitted</h2>
				<p className="text-sm text-muted-foreground mt-1">
					A consultant will review your request shortly.
				</p>
			</Card>
		)
	}

	return (
		<Card className="p-6">
			{/* Resource */}
			<div>
				<label className="text-sm font-medium">Resource</label>
				<Select value={resourceId ?? ''} onValueChange={setResourceId}>
					<SelectTrigger>
						{' '}
						<SelectValue placeholder="Select a resource" />
					</SelectTrigger>
					<SelectContent>
						{resources.map((r) => (
							<SelectItem key={r.id} value={r.id}>
								{r.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Date */}
			<div>
				<label className="text-sm font-medium">Date</label>
				<Input
					type="date"
					value={date ?? ''}
					onChange={(e) => {
						setDate(e.target.value)
						setSelectedSlot(null)
					}}
				/>
			</div>

			{/* Availability */}
			{loading && (
				<p className="text-sm text-muted-foreground">Checking availability…</p>
			)}

			{data && (
				<div className="space-y-3">
					<div className="text-sm font-medium">Available times</div>

					<div className="flex flex-wrap gap-2">
						{data.timeSlots.map((slot) => (
							<Button
								key={slot.startTime}
								type="button"
								variant={
									selectedSlot?.startTime === slot.startTime
										? 'default'
										: 'outline'
								}
								disabled={!slot.isAvailable}
								onClick={() => setSelectedSlot(slot)}
								className="min-w-[110px]"
							>
								{toAmPm(slot.startTime)}–{toAmPm(slot.endTime)}
							</Button>
						))}
					</div>

					{data.requiresClosedDayAck && (
						<div className="flex items-start gap-2">
							<Checkbox
								checked={closedAck}
								onCheckedChange={(v) => setClosedAck(Boolean(v))}
							/>
							<p className="text-sm">
								I understand this request is for a closed day and requires a
								consultant to come in specially.
							</p>
						</div>
					)}
				</div>
			)}

			{/* Notes */}
			<div>
				<label className="text-sm font-medium">Notes (optional)</label>
				<Textarea
					value={notes}
					onChange={(e) => setNotes(e.target.value)}
					rows={3}
				/>
			</div>

			<Input
				type="number"
				min={1}
				value={attendeeCount}
				onChange={(e) => setAttendeeCount(Number(e.target.value))}
				placeholder="Number of attendees"
			/>

			<Select
				value={assistanceLevel}
				onValueChange={(v) => setAssistanceLevel(v as AssistanceLevel)}
			>
				<SelectTrigger>
					<SelectValue placeholder="Assistance needed?" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="none">No assistance</SelectItem>
					<SelectItem value="startup">Help getting started</SelectItem>
					<SelectItem value="full">Assistance entire time</SelectItem>
				</SelectContent>
			</Select>

			{/* Error */}
			{error && <p className="text-sm text-red-600">{error}</p>}

			{/* Submit */}
			<Button
				onClick={handleSubmit}
				disabled={
					!resourceId ||
					!date ||
					!selectedSlot ||
					(data?.requiresClosedDayAck && !closedAck) ||
					submitting
				}
				className="w-full"
			>
				{submitting ? 'Submitting…' : 'Submit reservation request'}
			</Button>
		</Card>
	)
}
