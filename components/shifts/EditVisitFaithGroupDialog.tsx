'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Faith } from '@/types/faiths'
import type { TodayShift } from '@/types/shift-report'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { toDisplayFullName } from '@/lib/names'
import { toast } from 'sonner'
import { type VisitMeta, type VisitReason } from '@/lib/kiosk/visit-meta'

type PatronVisit = TodayShift['patrons'][number]

function isLdsFaith(faith: Faith | undefined) {
	return faith?.name === 'Church of Jesus Christ of Latter-day Saints'
}

export function formatVisitFaithSummary(patron: PatronVisit) {
	const isChurchWard =
		patron.faithGroupName === 'Church of Jesus Christ of Latter-day Saints' &&
		(patron.wardName || patron.stakeName)

	const parts = isChurchWard
		? [patron.wardName, patron.stakeName].filter(Boolean)
		: [patron.faithGroupName, patron.wardName, patron.stakeName].filter(Boolean)
	return parts.length > 0 ? parts.join(' • ') : null
}

function getInitialFaithSelection(patron: PatronVisit, faithTree: Faith[]) {
	const initialMeta: VisitMeta = {
		visitReason: patron.visitReason ?? 'patron',
		partOfFaithGroup: patron.partOfFaithGroup ?? null,
		faithGroupName: patron.faithGroupName ?? null,
		stakeName: patron.stakeName ?? null,
		wardName: patron.wardName ?? null,
		peopleCameWithVisitor: patron.peopleCameWithVisitor ?? 0,
	}

	const selectedFaith =
		faithTree.find((faith) => faith.name === initialMeta.faithGroupName) ?? null

	const selectedStake =
		selectedFaith?.stakes.find((stake) => stake.name === initialMeta.stakeName) ??
		null

	const selectedWard =
		selectedStake?.wards.find((ward) => ward.name === initialMeta.wardName) ?? null

	return {
		visitMeta: initialMeta,
		initialFaithId: selectedFaith?.id ?? '',
		initialWardId: selectedWard?.id ?? '',
	}
}

export function EditVisitFaithGroupDialog({
	open,
	onOpenChange,
	patron,
	faithTree,
	onSaved,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	patron: PatronVisit
	faithTree: Faith[]
	onSaved: () => void
}) {
	const initial = useMemo(
		() => getInitialFaithSelection(patron, faithTree),
		[patron, faithTree]
	)
	const [isSaving, setIsSaving] = useState(false)
	const [visitReason, setVisitReason] = useState<VisitReason>(
		initial.visitMeta.visitReason ?? 'patron'
	)
	const [faithId, setFaithId] = useState(initial.initialFaithId)
	const [wardId, setWardId] = useState(initial.initialWardId)
	const [groupSize, setGroupSize] = useState(
		String(initial.visitMeta.peopleCameWithVisitor ?? 0)
	)
	const prevFaithId = useRef(initial.initialFaithId)

	useEffect(() => {
		setVisitReason(initial.visitMeta.visitReason ?? 'patron')
		setFaithId(initial.initialFaithId)
		setWardId(initial.initialWardId)
		setGroupSize(String(initial.visitMeta.peopleCameWithVisitor ?? 0))
		prevFaithId.current = initial.initialFaithId
	}, [initial])

	const selectedFaith = faithTree.find((faith) => faith.id === faithId)
	const ldsFaith = isLdsFaith(selectedFaith)
	const selectedStake = selectedFaith?.stakes.find((stake) =>
		stake.wards.some((ward) => ward.id === wardId)
	)
	const selectedWard = selectedStake?.wards.find((ward) => ward.id === wardId)

	useEffect(() => {
		if (prevFaithId.current === faithId) return
		prevFaithId.current = faithId
		setWardId('')
	}, [faithId])

	const save = async () => {
		const peopleCameWithVisitor = Math.max(0, Math.floor(Number(groupSize) || 0))

		const visitMeta: VisitMeta = {
			visitReason,
			partOfFaithGroup: faithId ? true : null,
			faithGroupName: selectedFaith?.name ?? null,
			stakeName: selectedStake?.name ?? null,
			wardName: selectedWard?.name ?? null,
			peopleCameWithVisitor,
		}

		if (ldsFaith && faithId && !wardId) {
			toast.error('Select a ward to capture the matching stake.')
			return
		}

		setIsSaving(true)
		try {
			const res = await fetch(`/api/kiosk/visit/${patron.visitId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ visitMeta }),
			})

			if (!res.ok) {
				throw new Error('Unable to update this visit.')
			}

			toast.success('Faith group details updated.')
			onSaved()
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Unable to update this visit.'
			)
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit Faith Group</DialogTitle>
					<DialogDescription>
						Update the faith group details for {toDisplayFullName(patron.fullName)}.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<Field>
						<FieldLabel htmlFor="visit-reason">Visit type</FieldLabel>
						<select
							id="visit-reason"
							value={visitReason}
							onChange={(e) => setVisitReason(e.target.value as VisitReason)}
							className="w-full rounded-md border bg-background px-3 py-2 text-sm"
						>
							<option value="patron">Patron</option>
							<option value="group">Group</option>
							<option value="training">Training</option>
						</select>
					</Field>

					<Field>
						<FieldLabel htmlFor="faith-group">Faith group</FieldLabel>
						<select
							id="faith-group"
							value={faithId}
							onChange={(e) => setFaithId(e.target.value)}
							className="w-full rounded-md border bg-background px-3 py-2 text-sm"
						>
							<option value="">No faith group selected</option>
							{faithTree.map((faith) => (
								<option key={faith.id} value={faith.id}>
									{faith.name}
								</option>
							))}
						</select>
					</Field>

					{ldsFaith ? (
						<Field>
							<FieldLabel htmlFor="ward">Ward</FieldLabel>
							<select
								id="ward"
								value={wardId}
								onChange={(e) => setWardId(e.target.value)}
								className="w-full rounded-md border bg-background px-3 py-2 text-sm"
							>
								<option value="">Select ward</option>
								{selectedFaith?.stakes.map((stake) => (
									<optgroup key={stake.id} label={stake.name}>
										{stake.wards.map((ward) => (
											<option key={ward.id} value={ward.id}>
												{ward.name}
											</option>
										))}
									</optgroup>
								))}
							</select>
						</Field>
					) : null}

					<Field>
						<FieldLabel htmlFor="group-size">People who came with them</FieldLabel>
						<Input
							id="group-size"
							type="number"
							min="0"
							step="1"
							value={groupSize}
							onChange={(e) => setGroupSize(e.target.value)}
						/>
					</Field>
				</div>

				<DialogFooter>
					<Button
						type="button"
						variant="secondary"
						onClick={() => onOpenChange(false)}
						disabled={isSaving}
					>
						Cancel
					</Button>
					<Button type="button" onClick={save} disabled={isSaving}>
						{isSaving ? 'Saving...' : 'Save'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
