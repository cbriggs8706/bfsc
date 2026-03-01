// components/admin/shift/ShiftScheduler.tsx
'use client'

import { useMemo, useState } from 'react'
import {
	DndContext,
	DragEndEvent,
	useDraggable,
	useDroppable,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'
import { toAmPm } from '@/utils/time'
import { ShiftType } from '@/types/shifts'

//CORRECTED TIMEZONE - Ok to use toAmPM here

type Day = {
	weekday: number
	label: string
}

type Recurrence = {
	id: string
	label: string
	isActive: boolean
	sortOrder?: number
	weekOfMonth?: number | null
}

type Shift = {
	id: string
	weekday: number
	startTime: string
	endTime: string
	isActive: boolean
	type: ShiftType
	notes: string | null
	recurrences: Recurrence[]
}

type AssignmentRole = 'worker' | 'shift_lead' | 'trainer'

type Assignment = {
	id: string
	shiftRecurrenceId: string
	userId: string
	assignmentRole: AssignmentRole
	notes: string | null
	userName: string | null
	userRole: string
	userEmail: string
}

type Worker = {
	id: string
	name: string | null
	email: string
	role: string
}

type Props = {
	days: Day[]
	shifts: Shift[]
	assignments: Assignment[]
	workers: Worker[]
	canEdit: boolean
}

type SchedulerCard = {
	id: string // recurrence.id
	shift: Shift
	recurrence: Recurrence
}

function UnassignedBin({ canEdit }: { canEdit: boolean }) {
	const { setNodeRef, isOver } = useDroppable({ id: 'unassigned' })
	if (!canEdit) return null

	return (
		<div
			ref={setNodeRef}
			className={cn(
				'rounded-lg bg-(--green-logo-soft)/70 border border-dashed p-3 text-sm text-muted-foreground',
				isOver && 'border-primary bg-primary/5'
			)}
		>
			Drop here to unassign
		</div>
	)
}

function RoleBucket({
	title,
	droppableId,
	assignments,
	canEdit,
	onEdit,
}: {
	title: string
	droppableId: string
	assignments: Assignment[]
	canEdit: boolean
	onEdit: (a: Assignment) => void
}) {
	const { setNodeRef, isOver } = useDroppable({ id: droppableId })

	return (
		<div
			ref={setNodeRef}
			className={cn(
				'rounded-md border p-2 space-y-1 transition-colors',
				isOver && canEdit && 'border-primary bg-primary/5'
			)}
		>
			<div className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
				<span>{title}</span>
				<span className="text-[10px]">{assignments.length}</span>
			</div>

			{assignments.length === 0 ? (
				<p className="text-xs text-muted-foreground">—</p>
			) : (
				assignments.map((a) => (
					<DraggableAssignmentChip
						key={a.id}
						assignment={a}
						canEdit={canEdit}
						onClick={() => onEdit(a)}
					/>
				))
			)}
		</div>
	)
}

export function ShiftScheduler({
	shifts,
	assignments,
	workers,
	canEdit,
}: Props) {
	const [localAssignments, setLocalAssignments] =
		useState<Assignment[]>(assignments)
	const [printHeader, setPrintHeader] = useState('BFSC Shift Assignments')

	const cards = useMemo<SchedulerCard[]>(() => {
		return shifts
			.slice()
			.sort(
				(a, b) =>
					a.weekday - b.weekday || a.startTime.localeCompare(b.startTime)
			)
			.flatMap((shift) => {
				return (shift.recurrences ?? [])
					.slice()
					.sort((a, b) => {
						const aw = a.weekOfMonth ?? 0
						const bw = b.weekOfMonth ?? 0
						return aw - bw || (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
					})
					.map((recurrence) => ({
						id: recurrence.id,
						shift,
						recurrence,
					}))
			})
	}, [shifts])

	const regularCards = cards.filter((c) => c.shift.type !== 'appointment')

	const appointmentCards = cards.filter((c) => c.shift.type === 'appointment')

	// Group assignments by recurrence id
	const assignmentsByRecurrence = useMemo(() => {
		const map = new Map<string, Assignment[]>()
		for (const a of localAssignments) {
			const arr = map.get(a.shiftRecurrenceId) ?? []
			arr.push(a)
			map.set(a.shiftRecurrenceId, arr)
		}
		return map
	}, [localAssignments])

	const handleDragEnd = async ({ active, over }: DragEndEvent) => {
		if (!over || !canEdit) return

		const activeId = String(active.id)
		if (!activeId.startsWith('assign-')) return

		const assignmentId = activeId.replace('assign-', '')
		const overId = String(over.id)

		const existing = localAssignments.find((a) => a.id === assignmentId)
		if (!existing) return

		// drop into "unassigned" bin => delete
		if (overId === 'unassigned') {
			setLocalAssignments((prev) => prev.filter((a) => a.id !== assignmentId))

			const res = await fetch('/api/shifts/assignments', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ assignmentId }),
			})

			if (!res.ok) {
				// rollback
				setLocalAssignments((prev) => [...prev, existing])
			}
			return
		}

		const [newShiftRecurrenceId, newRoleRaw] = overId.split('|')
		const newRole = newRoleRaw as AssignmentRole

		const noChange =
			existing.shiftRecurrenceId === newShiftRecurrenceId &&
			existing.assignmentRole === newRole

		if (noChange) return

		// optimistic
		setLocalAssignments((prev) =>
			prev.map((a) =>
				a.id === assignmentId
					? {
							...a,
							shiftRecurrenceId: newShiftRecurrenceId,
							assignmentRole: newRole,
					  }
					: a
			)
		)

		const res = await fetch('/api/shifts/assignments', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				assignmentId,
				shiftRecurrenceId: newShiftRecurrenceId,
				assignmentRole: newRole,
			}),
		})

		if (!res.ok) {
			// rollback
			setLocalAssignments((prev) =>
				prev.map((a) => (a.id === assignmentId ? existing : a))
			)
		}
	}

	function printSchedule() {
		const params = new URLSearchParams({
			header: printHeader,
		})

		const win = window.open(
			`/shifts/print?${params.toString()}`,
			'_blank',
			'width=1400,height=900'
		)

		if (!win) return

		win.onload = () => {
			win.focus()
			win.print()
			win.onafterprint = () => win.close()
		}
	}

	return (
		<>
			<div className="flex items-end gap-4 mb-4 mt-4 rounded-lg border bg-card p-3">
				<div className="flex-1">
					<label className="block text-xs font-medium text-muted-foreground mb-1">
						Print Header
					</label>
					<Input
						value={printHeader}
						onChange={(e) => setPrintHeader(e.target.value)}
						placeholder="e.g. BFSC Shift Assignments"
					/>
				</div>

				<Button onClick={printSchedule}>Print Schedule</Button>
			</div>
			<DndContext onDragEnd={handleDragEnd}>
				<div className="space-y-4">
					<UnassignedBin canEdit={canEdit} />

					{regularCards.length > 0 && (
						<>
							<h2 className="text-lg font-semibold mt-6">Regular Shifts</h2>

							<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
								{regularCards.map((card) => {
									const cardAssignments =
										assignmentsByRecurrence.get(card.id) ?? []

									return (
										<ShiftCard
											key={card.id}
											shift={card.shift}
											recurrence={card.recurrence}
											assignments={cardAssignments}
											workers={workers}
											setLocalAssignments={setLocalAssignments}
											canEdit={canEdit}
										/>
									)
								})}
							</div>
						</>
					)}

					{appointmentCards.length > 0 && (
						<>
							<h2 className="text-lg font-semibold mt-10">
								By Appointment Only
							</h2>

							<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
								{appointmentCards.map((card) => {
									const cardAssignments =
										assignmentsByRecurrence.get(card.id) ?? []

									return (
										<ShiftCard
											key={card.id}
											shift={card.shift}
											recurrence={card.recurrence}
											assignments={cardAssignments}
											workers={workers}
											setLocalAssignments={setLocalAssignments}
											canEdit={canEdit}
										/>
									)
								})}
							</div>
						</>
					)}
				</div>
			</DndContext>{' '}
		</>
	)
}

function ShiftCard({
	shift,
	recurrence,
	assignments,
	workers,
	setLocalAssignments,
	canEdit,
}: {
	shift: Shift
	recurrence: Recurrence
	assignments: Assignment[]
	workers: Worker[]
	setLocalAssignments: React.Dispatch<React.SetStateAction<Assignment[]>>
	canEdit: boolean
}) {
	const [editing, setEditing] = useState<Assignment | null>(null)

	const openEditDialog = (a: Assignment) => {
		if (!canEdit) return
		setEditing(a)
	}

	const leads = assignments.filter((a) => a.assignmentRole === 'shift_lead')
	const trainers = assignments.filter((a) => a.assignmentRole === 'trainer')
	const helpers = assignments.filter((a) => a.assignmentRole === 'worker')

	return (
		<Card
			className={cn(
				'p-3 border rounded-lg space-y-2',
				(!shift.isActive || !recurrence.isActive) && 'opacity-50'
			)}
		>
			<div className="flex items-center justify-between gap-2">
				<div className="min-w-0">
					<div className="text-sm font-semibold">
						{toAmPm(shift.startTime)} – {toAmPm(shift.endTime)}
					</div>
					<div className="text-xs text-muted-foreground truncate">
						{recurrence.label}
					</div>
					{shift.type === 'appointment' && (
						<div className="text-[10px] text-muted-foreground">
							Center closed · appointment only
						</div>
					)}
				</div>

				{canEdit && (
					<AddWorkerDialog
						shiftRecurrenceId={recurrence.id}
						workers={workers}
						assignments={assignments}
						setLocalAssignments={setLocalAssignments}
					/>
				)}
			</div>

			<div className="grid gap-2">
				<RoleBucket
					title="Shift Leads"
					droppableId={`${recurrence.id}|shift_lead`}
					assignments={leads}
					canEdit={canEdit}
					onEdit={openEditDialog}
				/>

				<RoleBucket
					title="Trainers"
					droppableId={`${recurrence.id}|trainer`}
					assignments={trainers}
					canEdit={canEdit}
					onEdit={openEditDialog}
				/>

				<RoleBucket
					title="Workers"
					droppableId={`${recurrence.id}|worker`}
					assignments={helpers}
					canEdit={canEdit}
					onEdit={openEditDialog}
				/>
			</div>
			{editing && (
				<EditAssignmentDialog
					assignment={editing}
					onClose={() => setEditing(null)}
					setLocalAssignments={setLocalAssignments}
				/>
			)}
		</Card>
	)
}

function AddWorkerDialog({
	shiftRecurrenceId,
	workers,
	assignments,
	setLocalAssignments,
}: {
	shiftRecurrenceId: string
	workers: Worker[]
	assignments: Assignment[]
	setLocalAssignments: React.Dispatch<React.SetStateAction<Assignment[]>>
}) {
	const [open, setOpen] = useState(false)
	const [query, setQuery] = useState('')
	const [loading, setLoading] = useState(false)
	const [role, setRole] = useState<AssignmentRole>('worker')
	const [notes, setNotes] = useState('')
	const [error, setError] = useState<string | null>(null)

	const assignedUserIds = new Set(assignments.map((a) => a.userId))
	const availableWorkers = workers.filter((w) => !assignedUserIds.has(w.id))

	const filtered = availableWorkers.filter((c) =>
		(c.name ?? c.email).toLowerCase().includes(query.toLowerCase())
	)

	const handleAdd = async (worker: Worker) => {
		setError(null)
		setLoading(true)
		const tempId = `temp-${Date.now()}`

		// optimistic UI
		setLocalAssignments((prev) => [
			...prev,
			{
				id: tempId,
				shiftRecurrenceId,
				userId: worker.id,
				assignmentRole: role,
				notes: notes || null,
				userName: worker.name,
				userEmail: worker.email,
				userRole: worker.role,
			},
		])

		try {
			const res = await fetch('/api/shifts/assignments', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId: worker.id,
					shiftRecurrenceId,
					assignmentRole: role,
					notes: notes || null,
				}),
			})

			if (!res.ok) {
				const body = (await res.json().catch(() => null)) as
					| { error?: string }
					| null
				throw new Error(body?.error ?? 'Failed to create assignment')
			}
			const data: { id: string } = await res.json()

			setLocalAssignments((prev) =>
				prev.map((a) => (a.id === tempId ? { ...a, id: data.id } : a))
			)

			closeDialog()
		} catch (e) {
			// rollback
			setLocalAssignments((prev) => prev.filter((a) => a.id !== tempId))
			console.error(e)
			setError(
				e instanceof Error ? e.message : 'Failed to create assignment'
			)
		} finally {
			setLoading(false)
		}
	}

	const closeDialog = () => {
		setOpen(false)
		setQuery('')
		setNotes('')
		setRole('worker')
		setError(null)
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(isOpen) => {
				if (!isOpen) closeDialog()
				else setOpen(true)
			}}
		>
			<DialogTrigger asChild>
				<Button size="icon" variant="outline" className="h-7 w-7">
					<Plus className="h-4 w-4" />
				</Button>
			</DialogTrigger>

			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add Worker</DialogTitle>
				</DialogHeader>
				<div className="space-y-2 mb-3">
					<label className="text-xs font-medium text-muted-foreground">
						Role
					</label>

					<div className="flex gap-2">
						<Button
							type="button"
							size="sm"
							variant={role === 'worker' ? 'default' : 'outline'}
							onClick={() => setRole('worker')}
						>
							Worker
						</Button>

						<Button
							type="button"
							size="sm"
							variant={role === 'shift_lead' ? 'default' : 'outline'}
							onClick={() => setRole('shift_lead')}
						>
							Shift Lead
						</Button>

						<Button
							type="button"
							size="sm"
							variant={role === 'trainer' ? 'default' : 'outline'}
							onClick={() => setRole('trainer')}
						>
							Trainer
						</Button>
					</div>
				</div>

				<div className="space-y-2 mb-3">
					<label className="text-xs font-medium text-muted-foreground">
						Notes (optional)
					</label>
					<Input
						placeholder="e.g. arrives 3pm, 1st/3rd"
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
					/>
				</div>

				<Input
					placeholder="Search by name..."
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					className="mb-3"
				/>
				{error && <p className="mb-2 text-xs text-destructive">{error}</p>}

				<div className="max-h-64 overflow-auto space-y-1">
					{filtered.map((c) => (
						<Button
							key={c.id}
							variant="ghost"
							className="w-full justify-start"
							disabled={loading}
							onClick={() => handleAdd(c)}
						>
							{c.name ?? c.email}
							<Badge variant="outline" className="ml-2 text-[10px]">
								{c.role}
							</Badge>
						</Button>
					))}

					{filtered.length === 0 && (
						<p className="text-xs text-muted-foreground px-2">
							{availableWorkers.length === 0
								? 'All workers already assigned'
								: 'No matches'}
						</p>
					)}
				</div>
			</DialogContent>
		</Dialog>
	)
}

function EditAssignmentDialog({
	assignment,
	onClose,
	setLocalAssignments,
}: {
	assignment: Assignment
	onClose: () => void
	setLocalAssignments: React.Dispatch<React.SetStateAction<Assignment[]>>
}) {
	const [role, setRole] = useState<AssignmentRole>(assignment.assignmentRole)
	const [notes, setNotes] = useState(assignment.notes ?? '')
	const [saving, setSaving] = useState(false)

	const handleSave = async () => {
		setSaving(true)

		const previous = assignment

		// optimistic update
		setLocalAssignments((prev) =>
			prev.map((a) =>
				a.id === assignment.id
					? { ...a, assignmentRole: role, notes: notes || null }
					: a
			)
		)

		const res = await fetch('/api/shifts/assignments', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				assignmentId: assignment.id,
				assignmentRole: role,
				notes: notes || null,
			}),
		})

		if (!res.ok) {
			// rollback
			setLocalAssignments((prev) =>
				prev.map((a) => (a.id === previous.id ? previous : a))
			)
		}

		setSaving(false)
		onClose()
	}

	const handleRemove = async () => {
		const previous = assignment

		// optimistic remove
		setLocalAssignments((prev) => prev.filter((a) => a.id !== assignment.id))

		const res = await fetch('/api/shifts/assignments', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ assignmentId: assignment.id }),
		})

		if (!res.ok) {
			// rollback
			setLocalAssignments((prev) => [...prev, previous])
		}

		onClose()
	}

	return (
		<Dialog open onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						Edit {assignment.userName ?? assignment.userEmail}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-2">
					<label className="text-xs font-medium text-muted-foreground">
						Role
					</label>

					<div className="flex gap-2">
						<Button
							type="button"
							size="sm"
							variant={role === 'worker' ? 'default' : 'outline'}
							onClick={() => setRole('worker')}
						>
							Worker
						</Button>

						<Button
							type="button"
							size="sm"
							variant={role === 'shift_lead' ? 'default' : 'outline'}
							onClick={() => setRole('shift_lead')}
						>
							Shift Lead
						</Button>

						<Button
							type="button"
							size="sm"
							variant={role === 'trainer' ? 'default' : 'outline'}
							onClick={() => setRole('trainer')}
						>
							Trainer
						</Button>
					</div>
				</div>

				<div className="space-y-2">
					<label className="text-xs font-medium text-muted-foreground">
						Notes
					</label>
					<Input
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						placeholder="e.g. arrives 3pm"
					/>
				</div>

				<div className="flex justify-between pt-4">
					<Button
						variant="destructive"
						onClick={handleRemove}
						disabled={saving}
					>
						Remove from shift
					</Button>

					<div className="flex gap-2">
						<Button variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button onClick={handleSave} disabled={saving}>
							Save
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}

function DraggableAssignmentChip({
	assignment,
	canEdit,
	onClick,
}: {
	assignment: Assignment
	canEdit: boolean
	onClick: () => void
}) {
	const { attributes, listeners, setNodeRef, transform, isDragging } =
		useDraggable({
			id: `assign-${assignment.id}`,
			disabled: !canEdit,
		})

	return (
		<div
			ref={setNodeRef}
			style={{ transform: CSS.Translate.toString(transform) }}
			onClick={onClick}
			className={cn(
				'flex items-center justify-between rounded-md bg-muted px-2 py-1 text-[11px]',
				canEdit ? 'cursor-pointer' : 'cursor-default',
				isDragging && 'ring-2 ring-primary shadow-lg'
			)}
		>
			{/* LEFT: text (clickable) */}
			<span className="truncate">
				{assignment.userName ?? assignment.userEmail}
				{assignment.notes ? (
					<span className="ml-1 text-[10px] text-muted-foreground">
						({assignment.notes})
					</span>
				) : null}
			</span>

			{/* RIGHT: drag handle */}
			<div
				{...(canEdit ? listeners : {})}
				{...(canEdit ? attributes : {})}
				className="ml-2 cursor-move select-none text-muted-foreground"
				title="Drag to move"
			>
				⋮⋮
			</div>

			<Badge variant="outline" className="ml-2 text-[9px]">
				{assignment.assignmentRole === 'shift_lead'
					? 'Lead'
					: assignment.assignmentRole === 'trainer'
					? 'Trainer'
					: 'Worker'}
			</Badge>
		</div>
	)
}
