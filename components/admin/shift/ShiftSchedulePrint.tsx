import { toAmPm } from '@/utils/time'

const ROLE_ORDER: Array<Assignment['assignmentRole']> = [
	'shift_lead',
	'trainer',
	'consultant',
]

// components/admin/shift/ShiftSchedulePrint.tsx
type Day = {
	weekday: number
	label: string
}

type Assignment = {
	id: string
	shiftRecurrenceId: string
	userName: string | null
	assignmentRole: 'consultant' | 'shift_lead' | 'trainer'
	notes: string | null
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
	header: string
	days: Day[]
	shifts: ShiftWithRecurrences[]
	assignments: Assignment[]
}

export function ShiftSchedulePrint({
	header,
	days,
	shifts,
	assignments,
}: PrintProps) {
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
		<div className="flex flex-col justify-center gap-4">
			<h1 className="text-2xl font-bold text-center">{header}</h1>
			<section className="print-card flex text-xs">
				{days.map((day) => (
					<div
						key={day.weekday}
						className="print-day border p-2 space-y-2 flex-1 min-w-0"
					>
						{' '}
						<h2 className="font-bold text-center border-b pb-1">{day.label}</h2>
						{(shiftsByDay.get(day.weekday) ?? []).map((shift) => (
							<div key={shift.id} className="space-y-1">
								<div className="font-semibold">
									{toAmPm(shift.startTime)} – {toAmPm(shift.endTime)}
								</div>

								{shift.recurrences.map((r) => {
									const recAssignments = assignmentsByRecurrence.get(r.id) ?? []

									const assignmentsByRole = recAssignments.reduce<
										Record<Assignment['assignmentRole'], Assignment[]>
									>(
										(acc, a) => {
											acc[a.assignmentRole].push(a)
											return acc
										},
										{
											shift_lead: [],
											trainer: [],
											consultant: [],
										}
									)
									return (
										<div key={r.id} className="pl-2">
											<div className="italic">{r.label}</div>

											{recAssignments.length === 0 ? (
												<ul className="pl-3 list-disc">
													<li>—</li>
												</ul>
											) : (
												<ul className="pl-3 list-disc">
													{ROLE_ORDER.flatMap((role) =>
														assignmentsByRole[role].map((a) => (
															<li key={a.id}>
																{a.userName ?? '—'}
																{role === 'shift_lead' ? ' (lead)' : ''}
																{role === 'trainer' ? ' (train)' : ''}
																{a.notes ? ` (${a.notes})` : ''}
															</li>
														))
													)}
												</ul>
											)}
										</div>
									)
								})}
							</div>
						))}
					</div>
				))}
			</section>
		</div>
	)
}
