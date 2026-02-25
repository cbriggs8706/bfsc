'use client'

import { shiftGroupScheduleEventByDays, shiftGroupScheduleEventByWeek } from '@/app/actions/group-scheduling'
import { Button } from '@/components/ui/button'
import { addDays, differenceInCalendarDays, format, isSameDay, startOfWeek } from 'date-fns'
import { useMemo, useState, useTransition } from 'react'

type RotationEvent = {
	id: string
	title: string
	stakeId: string
	startsAtIso: string
}

const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function stakeColor(stakeId: string, sortedStakeIds: string[]) {
	const classes = [
		'bg-(--blue-accent-soft) border-(--blue-accent)',
		'bg-(--green-accent-soft) border-(--green-accent)',
		'bg-(--orange-accent-soft) border-(--orange-accent)',
		'bg-(--purple-accent-soft) border-(--purple-accent)',
		'bg-(--red-accent-soft) border-(--red-accent)',
		'bg-(--gray-accent-soft) border-(--gray-accent)',
	]
	const idx = sortedStakeIds.findIndex((id) => id === stakeId)
	return classes[idx >= 0 ? idx % classes.length : 0]
}

export function WeeklyRotationBoard({
	events,
	locale,
	sortedStakeIds,
}: {
	events: RotationEvent[]
	locale: string
	sortedStakeIds: string[]
}) {
	const [draggedEventId, setDraggedEventId] = useState<string | null>(null)
	const [isPending, startTransition] = useTransition()

	const weekStarts = useMemo(
		() =>
			Array.from(
				new Set(
					events.map((event) =>
						startOfWeek(new Date(event.startsAtIso), { weekStartsOn: 0 }).toISOString()
					)
				)
			)
				.map((iso) => new Date(iso))
				.sort((a, b) => a.getTime() - b.getTime()),
		[events]
	)

	return (
		<div className="space-y-4">
			{weekStarts.length === 0 ? (
				<p className="text-sm text-muted-foreground">
					Add events to see weekly planning blocks.
				</p>
			) : null}
			{weekStarts.map((weekStart) => (
				<div key={weekStart.toISOString()} className="rounded-md border p-3">
					<div className="mb-3 text-sm font-medium">
						Week of {format(weekStart, 'MMM d, yyyy')}
					</div>
					<div className="grid gap-2 md:grid-cols-7">
						{dayHeaders.map((label, dayIndex) => {
							const dayDate = addDays(weekStart, dayIndex)
							const dayEvents = events.filter((event) =>
								isSameDay(new Date(event.startsAtIso), dayDate)
							)
							return (
								<div
									key={`${weekStart.toISOString()}-${label}`}
									className="rounded-md border bg-card p-2"
									onDragOver={(e) => e.preventDefault()}
									onDrop={() => {
										if (!draggedEventId) return
										const dragged = events.find((event) => event.id === draggedEventId)
										if (!dragged) return
										const deltaDays = differenceInCalendarDays(
											dayDate,
											new Date(dragged.startsAtIso)
										)
										if (!deltaDays) return

										const formData = new FormData()
										formData.set('locale', locale)
										formData.set('id', dragged.id)
										formData.set('deltaDays', String(deltaDays))
										startTransition(async () => {
											await shiftGroupScheduleEventByDays(formData)
										})
										setDraggedEventId(null)
									}}
								>
									<div className="mb-2 text-xs font-semibold text-muted-foreground">
										{label} {format(dayDate, 'M/d')}
									</div>
									<div className="space-y-2">
										{dayEvents.length === 0 ? (
											<p className="text-xs text-muted-foreground">No blocks</p>
										) : null}
										{dayEvents.map((event) => (
											<div
												key={event.id}
												draggable
												onDragStart={() => setDraggedEventId(event.id)}
												className={`rounded border p-2 text-xs ${stakeColor(event.stakeId, sortedStakeIds)}`}
											>
												<div className="font-semibold">{event.title}</div>
												<div className="text-[11px]">
													{format(new Date(event.startsAtIso), 'h:mm a')}
												</div>
												<div className="mt-2 flex gap-1">
													<form action={shiftGroupScheduleEventByWeek}>
														<input type="hidden" name="locale" value={locale} />
														<input type="hidden" name="id" value={event.id} />
														<input type="hidden" name="direction" value="back" />
														<Button
															disabled={isPending}
															size="sm"
															variant="outline"
															className="h-6 px-2 text-[10px]"
														>
															-1w
														</Button>
													</form>
													<form action={shiftGroupScheduleEventByWeek}>
														<input type="hidden" name="locale" value={locale} />
														<input type="hidden" name="id" value={event.id} />
														<input type="hidden" name="direction" value="forward" />
														<Button
															disabled={isPending}
															size="sm"
															variant="outline"
															className="h-6 px-2 text-[10px]"
														>
															+1w
														</Button>
													</form>
												</div>
											</div>
										))}
									</div>
								</div>
							)
						})}
					</div>
				</div>
			))}
		</div>
	)
}
