// components/resources/ReservationForm.tsx
'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from '@/components/ui/select'
import { useEffect } from 'react'
import { getAvailability } from '@/lib/actions/resource/availability'
import { ReservationWithUser, Reservation, Resource } from '@/types/resource'
import { TimeFormat } from '@/types/shifts'
import { formatTimeRange, toHHMM, toYYYYMMDD } from '@/utils/time'

type Mode = 'create' | 'read' | 'update' | 'delete'

type Props = {
	initial?: Partial<ReservationWithUser>
	mode: Mode
	onSubmit?: (data: Reservation) => Promise<unknown>
	reservationId?: string
	locale?: string
	resources: Resource[]
	timeFormat: TimeFormat
	canSetStatus?: boolean
}

export function ReservationForm({
	initial = {},
	mode,
	onSubmit,
	reservationId,
	locale,
	resources,
	timeFormat,
	canSetStatus = false,
}: Props) {
	const [pending, startTransition] = useTransition()
	const disabled = mode === 'read' || mode === 'delete'
	const t = useTranslations('common')
	const [date, setDate] = useState(() => {
		const d = new Date()
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
			2,
			'0'
		)}-${String(d.getDate()).padStart(2, '0')}`
	})

	const [slots, setSlots] = useState<{ startTime: string; endTime: string }[]>(
		[]
	)
	const [slotStart, setSlotStart] = useState('')
	const [loadingSlots, setLoadingSlots] = useState(false)

	const [form, setForm] = useState<Reservation>({
		resourceId: initial.resourceId ?? '',
		userId: initial.userId ?? '',

		startTime: initial.startTime ? new Date(initial.startTime) : new Date(),

		endTime: initial.endTime ? new Date(initial.endTime) : new Date(),

		attendeeCount: initial.attendeeCount ?? 1,
		assistanceLevel: initial.assistanceLevel ?? 'none',
		status: initial.status ?? 'pending',

		isClosedDayRequest: initial.isClosedDayRequest ?? false,

		notes: initial.notes ?? '',
	})

	function submit() {
		if (!onSubmit) return
		if (!slotStart) return // must select a time block

		startTransition(async () => {
			await onSubmit(form)
		})
	}

	useEffect(() => {
		if (!initial?.startTime || !initial?.endTime) return

		const start = new Date(initial.startTime)
		const end = new Date(initial.endTime)

		setDate(toYYYYMMDD(start))
		setSlotStart(toHHMM(start))

		setForm((prev) => ({
			...prev,
			startTime: start,
			endTime: end,
		}))
		// ⚠️ run once only
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	useEffect(() => {
		if (!form.resourceId || !date) {
			setSlots([])
			setSlotStart('')
			return
		}

		let cancelled = false

		async function load() {
			setLoadingSlots(true)
			try {
				const res = await getAvailability({
					resourceId: form.resourceId,
					date,
					excludeReservationId: reservationId,
				})

				if (cancelled) return

				setSlots(
					res.timeSlots.map((s) => ({
						startTime: s.startTime,
						endTime: s.endTime,
					}))
				)

				// Clear invalid selection
				if (
					mode === 'create' &&
					slotStart &&
					!res.timeSlots.some((s) => s.startTime === slotStart)
				) {
					setSlotStart('')
				}
			} finally {
				if (!cancelled) setLoadingSlots(false)
			}
		}

		load()
		return () => {
			cancelled = true
		}
	}, [form.resourceId, date, reservationId])

	const resourcesByType = resources.reduce<
		Record<Resource['type'], Resource[]>
	>((acc, r) => {
		;(acc[r.type] ||= []).push(r)
		return acc
	}, {} as Record<Resource['type'], Resource[]>)

	return (
		<Card className="p-6 space-y-4">
			{/* Resource + User */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div className="space-y-1">
					<Label>{t('resource.title')}</Label>
					<Select
						disabled={disabled}
						value={form.resourceId}
						onValueChange={(v) => setForm({ ...form, resourceId: v })}
					>
						<SelectTrigger>
							<SelectValue placeholder={t('resource.select')} />
						</SelectTrigger>

						<SelectContent>
							{(
								Object.entries(resourcesByType) as [
									Resource['type'],
									Resource[]
								][]
							).map(([type, items]) => (
								<div key={type}>
									{/* Group label */}
									<div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
										{t(`resource.typesP.${type}`)}
									</div>

									{items.map((r) => (
										<SelectItem key={r.id} value={r.id}>
											{r.name}
										</SelectItem>
									))}
								</div>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Date + Time Block */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div className="space-y-1">
					<Label>{t('date')}</Label>
					<Input
						type="date"
						disabled={disabled}
						value={date}
						onChange={(e) => setDate(e.target.value)}
					/>
				</div>

				<div className="space-y-1">
					<Label>{t('timeBlock')}</Label>
					<Select
						disabled={disabled || !form.resourceId || loadingSlots}
						value={slotStart}
						onValueChange={(v) => {
							const found = slots.find((s) => s.startTime === v)
							if (!found) return

							setSlotStart(v)

							setForm((prev) => ({
								...prev,
								startTime: new Date(`${date}T${found.startTime}:00`),
								endTime: new Date(`${date}T${found.endTime}:00`),
							}))
						}}
					>
						<SelectTrigger>
							<SelectValue
								placeholder={
									loadingSlots
										? t('loading')
										: !form.resourceId
										? t('selectResourceFirst')
										: t('selectTimeBlock')
								}
							/>
						</SelectTrigger>

						<SelectContent>
							{slots.length === 0 ? (
								<SelectItem value="__none__" disabled>
									{t('noAvailability')}
								</SelectItem>
							) : (
								slots.map((s) => (
									<SelectItem key={s.startTime} value={s.startTime}>
										{formatTimeRange(s.startTime, s.endTime, timeFormat)}
									</SelectItem>
								))
							)}
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Attendance / Assistance / Status */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="space-y-1">
					<Label>{t('attendees')}</Label>
					<Input
						type="number"
						disabled={disabled}
						min={1}
						value={form.attendeeCount}
						onChange={(e) =>
							setForm({ ...form, attendeeCount: +e.target.value })
						}
					/>
				</div>

				<div className="space-y-1">
					<Label>{t('assistance')}</Label>
					<Select
						disabled={disabled}
						value={form.assistanceLevel}
						onValueChange={(v) =>
							setForm({
								...form,
								assistanceLevel: v as ReservationWithUser['assistanceLevel'],
							})
						}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="none">{t('none')}</SelectItem>
							<SelectItem value="startup">{t('startup')}</SelectItem>
							<SelectItem value="full">{t('full')}</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{canSetStatus ? (
					<div className="space-y-1">
						<Label>{t('status')}</Label>
						<Select
							disabled={disabled}
							value={form.status}
							onValueChange={(v) =>
								setForm({
									...form,
									status: v as ReservationWithUser['status'],
								})
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="pending">
									{t('reservation.statuses.pending')}
								</SelectItem>
								<SelectItem value="approved">
									{t('reservation.statuses.approved')}
								</SelectItem>
								<SelectItem value="denied">
									{t('reservation.statuses.denied')}
								</SelectItem>
								<SelectItem value="cancelled">
									{t('reservation.statuses.cancelled')}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
				) : (
					<div className="space-y-1">
						<Label>{t('status')}</Label>
						<div className="h-10 flex items-center text-sm text-muted-foreground">
							{t('reservation.statuses.pending')}
						</div>
					</div>
				)}
			</div>

			{/* Notes */}
			<div className="space-y-1">
				<Label>{t('notes')}</Label>
				<Textarea
					disabled={disabled}
					value={form.notes ?? ''}
					onChange={(e) => setForm({ ...form, notes: e.target.value })}
				/>
			</div>

			{/* Read mode actions */}
			{mode === 'read' && reservationId && locale && (
				<div className="flex gap-2">
					<Link href={`/${locale}/admin/reservation/update/${reservationId}`}>
						<Button>{t('edit')}</Button>
					</Link>

					<Link href={`/${locale}/admin/reservation/delete/${reservationId}`}>
						<Button variant="destructive">{t('delete')}</Button>
					</Link>
				</div>
			)}

			{/* Submit */}
			{mode !== 'read' && (
				<Button
					variant={mode === 'delete' ? 'destructive' : 'default'}
					onClick={submit}
					disabled={pending || !slotStart}
				>
					{pending
						? 'Working…'
						: mode === 'delete'
						? `${t('delete')} ${t('reservation.title')}`
						: mode === 'update'
						? `${t('update')} ${t('reservation.title')}`
						: `${t('create')} ${t('reservation.title')}`}
				</Button>
			)}
		</Card>
	)
}

/* -----------------------------------------------
 * Helpers
 * --------------------------------------------- */

function toInputDate(d: Date) {
	const pad = (n: number) => n.toString().padStart(2, '0')
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
		d.getHours()
	)}:${pad(d.getMinutes())}`
}
