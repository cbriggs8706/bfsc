// components/admin/shift/ShiftScheduler.tsx
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
	notes: string | null
	recurrences: Recurrence[]
}

type Assignment = {
	id: string
	shiftRecurrenceId: string
	userId: string
	isPrimary: boolean
	userName: string | null
	userRole: string
	userEmail: string
}

type Consultant = {
	id: string
	name: string | null
	email: string
	role: string
}

type Props = {
	days: Day[] // you can keep passing this for ordering/grouping headers if you want
	shifts: Shift[]
	assignments: Assignment[]
	consultants: Consultant[]
}

type SchedulerCard = {
	id: string // recurrence.id
	shift: Shift
	recurrence: Recurrence
}

export function ShiftScheduler({ shifts, assignments, consultants }: Props) {
	const [localAssignments, setLocalAssignments] =
		useState<Assignment[]>(assignments)

	// Build a flat list of recurrence “cards” to render
	const cards = useMemo<SchedulerCard[]>(() => {
		return shifts
			.slice()
			.sort(
				(a, b) =>
					a.weekday - b.weekday || a.startTime.localeCompare(b.startTime)
			)
			.flatMap((shift) => {
				const recs = (shift.recurrences ?? [])
					.slice()
					.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

				return recs.map((recurrence) => ({
					id: recurrence.id,
					shift,
					recurrence,
				}))
			})
	}, [shifts])

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
		if (!over) return

		const activeId = String(active.id)
		if (!activeId.startsWith('assign-')) return

		const assignmentId = activeId.replace('assign-', '')
		const newShiftRecurrenceId = String(over.id)

		const existing = localAssignments.find((a) => a.id === assignmentId)
		if (!existing) return
		if (existing.shiftRecurrenceId === newShiftRecurrenceId) return

		// optimistic
		setLocalAssignments((prev) =>
			prev.map((a) =>
				a.id === assignmentId
					? { ...a, shiftRecurrenceId: newShiftRecurrenceId }
					: a
			)
		)

		const res = await fetch('/api/shifts/assignments', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				assignmentId,
				shiftRecurrenceId: newShiftRecurrenceId,
			}),
		})

		// rollback if API fails
		if (!res.ok) {
			setLocalAssignments((prev) =>
				prev.map((a) =>
					a.id === assignmentId
						? { ...a, shiftRecurrenceId: existing.shiftRecurrenceId }
						: a
				)
			)
		}
	}

	return (
		<DndContext onDragEnd={handleDragEnd}>
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{cards.map((card) => {
					const cardAssignments = assignmentsByRecurrence.get(card.id) ?? []

					return (
						<ShiftCard
							key={card.id}
							shift={card.shift}
							recurrence={card.recurrence}
							assignments={cardAssignments}
							consultants={consultants}
							setLocalAssignments={setLocalAssignments}
						/>
					)
				})}
			</div>
		</DndContext>
	)
}

function ShiftCard({
	shift,
	recurrence,
	assignments,
	consultants,
	setLocalAssignments,
}: {
	shift: Shift
	recurrence: Recurrence
	assignments: Assignment[]
	consultants: Consultant[]
	setLocalAssignments: React.Dispatch<React.SetStateAction<Assignment[]>>
}) {
	const { setNodeRef, isOver } = useDroppable({
		id: recurrence.id, // droppable target is recurrence id
	})

	return (
		<Card
			ref={setNodeRef}
			className={cn(
				'p-3 border rounded-lg space-y-2 transition-colors',
				isOver && 'border-primary bg-primary/5',
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
				</div>

				<AddConsultantDialog
					shiftRecurrenceId={recurrence.id}
					consultants={consultants}
					setLocalAssignments={setLocalAssignments}
				/>
			</div>

			<div className="space-y-1">
				{assignments.length === 0 ? (
					<p className="text-xs text-muted-foreground">
						No consultants assigned
					</p>
				) : (
					assignments.map((a) => (
						<DraggableAssignmentChip key={a.id} assignment={a} />
					))
				)}
			</div>
		</Card>
	)
}

function AddConsultantDialog({
	shiftRecurrenceId,
	consultants,
	setLocalAssignments,
}: {
	shiftRecurrenceId: string
	consultants: Consultant[]
	setLocalAssignments: React.Dispatch<React.SetStateAction<Assignment[]>>
}) {
	const [open, setOpen] = useState(false)
	const [query, setQuery] = useState('')
	const [loading, setLoading] = useState(false)

	const filtered = consultants.filter((c) =>
		(c.name ?? c.email).toLowerCase().includes(query.toLowerCase())
	)

	const handleAdd = async (consultant: Consultant) => {
		setLoading(true)
		const tempId = `temp-${Date.now()}`

		// optimistic UI
		setLocalAssignments((prev) => [
			...prev,
			{
				id: tempId,
				shiftRecurrenceId,
				userId: consultant.id,
				isPrimary: true,
				userName: consultant.name,
				userEmail: consultant.email,
				userRole: consultant.role,
			},
		])

		try {
			const res = await fetch('/api/shifts/assignments', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId: consultant.id, shiftRecurrenceId }),
			})

			if (!res.ok) throw new Error('Failed to create assignment')
			const data: { id: string } = await res.json()

			setLocalAssignments((prev) =>
				prev.map((a) => (a.id === tempId ? { ...a, id: data.id } : a))
			)

			setOpen(false)
		} catch (e) {
			// rollback
			setLocalAssignments((prev) => prev.filter((a) => a.id !== tempId))
			console.error(e)
		} finally {
			setLoading(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="icon" variant="outline" className="h-7 w-7">
					<Plus className="h-4 w-4" />
				</Button>
			</DialogTrigger>

			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add Consultant</DialogTitle>
				</DialogHeader>

				<Input
					placeholder="Search by name..."
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					className="mb-3"
				/>

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
						<p className="text-xs text-muted-foreground px-2">No matches</p>
					)}
				</div>
			</DialogContent>
		</Dialog>
	)
}

function DraggableAssignmentChip({ assignment }: { assignment: Assignment }) {
	const { attributes, listeners, setNodeRef, transform, isDragging } =
		useDraggable({
			id: `assign-${assignment.id}`,
		})

	return (
		<div
			ref={setNodeRef}
			style={{ transform: CSS.Translate.toString(transform) }}
			{...listeners}
			{...attributes}
			className={cn(
				'flex items-center justify-between rounded-md bg-muted px-2 py-1 text-[11px] cursor-move',
				isDragging && 'ring-2 ring-primary shadow-lg'
			)}
		>
			<span className="truncate">
				{assignment.userName ?? assignment.userEmail}
			</span>
			<Badge variant="outline" className="ml-2 text-[9px]">
				{assignment.userRole}
			</Badge>
		</div>
	)
}
