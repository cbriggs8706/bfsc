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

type Shift = {
	id: string
	weekday: number
	startTime: string
	endTime: string
	notes: string | null
	isActive: boolean
}

type Assignment = {
	id: string
	shiftId: string
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
	days: Day[]
	shifts: Shift[]
	assignments: Assignment[]
	consultants: Consultant[]
}

export function ShiftScheduler({
	days,
	shifts,
	assignments,
	consultants,
}: Props) {
	const [localAssignments, setLocalAssignments] = useState(assignments)

	const assignmentsByShift = useMemo(() => {
		const map = new Map<string, Assignment[]>()
		for (const a of localAssignments) {
			const arr = map.get(a.shiftId) ?? []
			arr.push(a)
			map.set(a.shiftId, arr)
		}
		return map
	}, [localAssignments])

	const handleDragEnd = async (event: DragEndEvent) => {
		const { active, over } = event
		if (!over) return

		const activeId = String(active.id)
		const overId = String(over.id)

		if (!overId.startsWith('shift-')) return
		const shiftId = overId.replace('shift-', '')

		// Move existing assignment
		if (activeId.startsWith('assign-')) {
			const assignmentId = activeId.replace('assign-', '')
			const assignment = localAssignments.find((a) => a.id === assignmentId)
			if (!assignment || assignment.shiftId === shiftId) return

			setLocalAssignments((prev) =>
				prev.map((a) => (a.id === assignmentId ? { ...a, shiftId } : a))
			)

			await fetch('/api/shifts/assignments', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ assignmentId, shiftId }),
			})

			return
		}
	}

	return (
		<DndContext onDragEnd={handleDragEnd}>
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{days.map((day) => {
					const dayShifts = shifts
						.filter((s) => s.weekday === day.weekday)
						.sort((a, b) => a.startTime.localeCompare(b.startTime))

					return (
						<div key={day.weekday} className="space-y-3">
							<h2 className="text-lg font-semibold">{day.label}</h2>

							{dayShifts.map((shift) => (
								<ShiftCard
									key={shift.id}
									shift={shift}
									assignments={assignmentsByShift.get(shift.id) ?? []}
									consultants={consultants}
									setLocalAssignments={setLocalAssignments}
								/>
							))}
						</div>
					)
				})}
			</div>
		</DndContext>
	)
}

function ShiftCard({
	shift,
	assignments,
	consultants,
	setLocalAssignments,
}: {
	shift: Shift
	assignments: Assignment[]
	consultants: Consultant[]
	setLocalAssignments: React.Dispatch<React.SetStateAction<Assignment[]>>
}) {
	const { setNodeRef, isOver } = useDroppable({
		id: `shift-${shift.id}`,
	})

	return (
		<Card
			ref={setNodeRef}
			className={cn(
				'p-3 border rounded-lg space-y-2 transition-colors',
				isOver && 'border-primary bg-primary/5',
				!shift.isActive && 'opacity-50'
			)}
		>
			<div className="flex items-center justify-between">
				<div className="text-sm font-semibold">
					{toAmPm(shift.startTime)} – {toAmPm(shift.endTime)}
				</div>
				<AddConsultantDialog
					shiftId={shift.id}
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
	shiftId,
	consultants,
	setLocalAssignments,
}: {
	shiftId: string
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
				shiftId,
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
				body: JSON.stringify({ userId: consultant.id, shiftId }),
			})

			const data = await res.json()

			setLocalAssignments((prev) =>
				prev.map((a) => (a.id === tempId ? { ...a, id: data.id } : a))
			)

			setOpen(false)
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
			<span className="truncate">{assignment.userName}</span>
			<Badge variant="outline" className="ml-2 text-[9px]">
				{assignment.userRole}
			</Badge>
		</div>
	)
}
