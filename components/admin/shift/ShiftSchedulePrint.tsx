import { toAmPm } from '@/utils/time'

// components/admin/shift/ShiftSchedulePrint.tsx
type Day = {
	weekday: number
	label: string
}

type Assignment = {
	id: string
	shiftRecurrenceId: string
	userName: string | null
}

type ShiftRecurrence = {
	id: string
	label: string
	weekOfMonth: number | null
	isActive: boolean
	sortOrder: number
}

type ShiftWithRecurrences = {
	id: string
	weekday: number
	startTime: string
	endTime: string
	recurrences: ShiftRecurrence[]
}

type PrintProps = {
	days: Day[]
	shifts: ShiftWithRecurrences[]
	assignments: Assignment[]
}

export function ShiftSchedulePrint({ days, shifts, assignments }: PrintProps) {
	/* ---------------------------------------------
	 * Group assignments by recurrence
	 * ------------------------------------------- */
	const assignmentsByRecurrence = new Map<string, Assignment[]>()

	for (const a of assignments) {
		const list = assignmentsByRecurrence.get(a.shiftRecurrenceId) ?? []
		list.push(a)
		assignmentsByRecurrence.set(a.shiftRecurrenceId, list)
	}

	/* ---------------------------------------------
	 * Group shifts by weekday
	 * ------------------------------------------- */
	const shiftsByDay = new Map<number, ShiftWithRecurrences[]>()

	for (const shift of shifts) {
		const list = shiftsByDay.get(shift.weekday) ?? []
		list.push(shift)
		shiftsByDay.set(shift.weekday, list)
	}

	/* ---------------------------------------------
	 * Render
	 * ------------------------------------------- */
	return (
		<section
			className="print-card grid gap-3 text-xs"
			style={{
				gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))`,
			}}
		>
			{days.map((day) => (
				<div key={day.weekday} className="border p-2 space-y-2">
					<h2 className="font-bold text-center border-b pb-1">{day.label}</h2>

					{(shiftsByDay.get(day.weekday) ?? []).map((shift) => (
						<div key={shift.id} className="space-y-1">
							<div className="font-semibold">
								{toAmPm(shift.startTime)} – {toAmPm(shift.endTime)}
							</div>

							{shift.recurrences.map((r) => {
								const recAssignments = assignmentsByRecurrence.get(r.id) ?? []

								return (
									<div key={r.id} className="pl-2">
										<div className="italic">{r.label}</div>

										<ul className="pl-3 list-disc">
											{recAssignments.length === 0 ? (
												<li>—</li>
											) : (
												recAssignments.map((a) => (
													<li key={a.id}>{a.userName ?? '—'}</li>
												))
											)}
										</ul>
									</div>
								)
							})}
						</div>
					))}
				</div>
			))}
		</section>
	)
}
