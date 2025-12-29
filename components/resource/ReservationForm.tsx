// components/resources/ReservationForm.tsx
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from '@/components/ui/select'
import { useEffect } from 'react'
import { getAvailability } from '@/lib/actions/resource/availability'
import { Resource } from '@/types/resource'
import { TimeFormat } from '@/types/shifts'
import { formatTimeRange } from '@/utils/time'
import { Mode } from '@/types/crud'
import z from 'zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { Field, FieldError, FieldGroup, FieldLabel } from '../ui/field'
import { Required } from '../Required'
import {
	deleteReservation,
	ReservationFormValues,
	saveReservation,
} from '@/lib/actions/resource/reservation'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'

/* ------------------------------------------------------------------ */
/* UI Schema (matches server form shape) */
/* ------------------------------------------------------------------ */

function schema(t: (k: string) => string) {
	return z.object({
		resourceId: z.string().uuid(t('required')),
		date: z.string().min(1, t('required')),
		startTime: z.string().min(1, t('required')),

		attendeeCount: z.string().min(1, t('required')),
		assistanceLevel: z.enum(['none', 'startup', 'full']),
		isClosedDayRequest: z.boolean(),

		notes: z.string().catch(''),

		status: z.enum(['pending', 'confirmed', 'denied', 'cancelled']).optional(),
	})
}

/* ------------------------------------------------------------------ */
/* Props */
/* ------------------------------------------------------------------ */

type Props = {
	locale: string
	mode: Mode
	reservationId?: string
	initialValues?: Partial<ReservationFormValues>
	resources: Resource[]
	timeFormat: TimeFormat
	canSetStatus?: boolean
	successRedirect?: string
}

/* ------------------------------------------------------------------ */
/* Component */
/* ------------------------------------------------------------------ */

export function ReservationForm({
	locale,
	mode,
	reservationId,
	initialValues,
	resources,
	timeFormat,
	canSetStatus = false,
	successRedirect,
}: Props) {
	const t = useTranslations('common')
	const router = useRouter()
	const fieldsDisabled = mode === 'read' || mode === 'delete'

	/* ---------------- form ---------------- */

	const form = useForm<ReservationFormValues>({
		resolver: zodResolver(schema(t)),
		defaultValues: {
			resourceId: '',
			date: '',
			startTime: '',
			attendeeCount: '',
			assistanceLevel: 'none',
			isClosedDayRequest: false,
			notes: '',
			status: 'pending',
			...initialValues,
		},
	})

	const {
		control,
		handleSubmit,
		setError,
		formState: { errors, isSubmitting },
	} = form

	/* ---------------- watched values ---------------- */

	const resourceId = useWatch({ control, name: 'resourceId' })
	const date = useWatch({ control, name: 'date' })
	const startTime = useWatch({ control, name: 'startTime' })

	/* ---------------- availability ---------------- */

	const [slots, setSlots] = useState<{ startTime: string; endTime: string }[]>(
		[]
	)
	const [loadingSlots, setLoadingSlots] = useState(false)

	useEffect(() => {
		if (!resourceId || !date) {
			setSlots([])
			form.setValue('startTime', '')
			return
		}

		let cancelled = false

		async function load() {
			setLoadingSlots(true)
			try {
				const res = await getAvailability({
					resourceId,
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

				if (
					startTime &&
					!res.timeSlots.some((s) => s.startTime === startTime)
				) {
					form.setValue('startTime', '')
				}
			} finally {
				if (!cancelled) setLoadingSlots(false)
			}
		}

		load()
		return () => {
			cancelled = true
		}
	}, [resourceId, date, reservationId])

	/* ---------------- submit ---------------- */

	async function onSubmit(values: ReservationFormValues) {
		const redirectTo = successRedirect ?? `/${locale}/admin/reservation`

		if (mode === 'delete') {
			const res = await deleteReservation(reservationId!)
			if (!res.ok) {
				setError('root', { message: res.message })
				return
			}
			router.push(redirectTo)
			return
		}

		const res = await saveReservation(
			mode === 'update' ? 'update' : 'create',
			reservationId ?? null,
			values
		)

		if (!res.ok) {
			setError('root', { message: res.message })
			return
		}

		router.push(redirectTo)
	}

	/* ---------------- grouping ---------------- */

	const resourcesByType = resources.reduce<
		Record<Resource['type'], Resource[]>
	>((acc, r) => {
		;(acc[r.type] ||= []).push(r)
		return acc
	}, {} as Record<Resource['type'], Resource[]>)

	/* ---------------- render ---------------- */

	return (
		<Card className="w-full">
			<CardContent>
				<form id="reservation-form" onSubmit={handleSubmit(onSubmit)}>
					<FieldGroup>
						{/* Root error */}
						{errors.root && (
							<p className="text-sm text-destructive">{errors.root.message}</p>
						)}

						{/* Resource */}
						<Controller
							name="resourceId"
							control={control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>
										<Required>{t('resource.title')}</Required>
									</FieldLabel>

									<Select
										value={field.value}
										onValueChange={field.onChange}
										disabled={fieldsDisabled}
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

									{fieldState.error && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>

						{/* Date */}
						<Controller
							name="date"
							control={control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>
										<Required>{t('date')}</Required>
									</FieldLabel>
									<Input type="date" {...field} disabled={fieldsDisabled} />
									{fieldState.error && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>

						{/* Time block */}
						<Controller
							name="startTime"
							control={control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>
										<Required>{t('timeBlock')}</Required>
									</FieldLabel>
									<Select
										value={field.value}
										onValueChange={field.onChange}
										disabled={fieldsDisabled || loadingSlots || !resourceId}
									>
										<SelectTrigger>
											<SelectValue
												placeholder={
													loadingSlots
														? t('loading')
														: !resourceId
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
														{formatTimeRange(
															s.startTime,
															s.endTime,
															timeFormat
														)}
													</SelectItem>
												))
											)}
										</SelectContent>
									</Select>

									{fieldState.error && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>

						{/* Attendees */}
						<Controller
							name="attendeeCount"
							control={control}
							render={({ field }) => (
								<Field>
									<FieldLabel>{t('attendees')}</FieldLabel>
									<Input
										type="number"
										min={1}
										{...field}
										disabled={fieldsDisabled}
									/>
								</Field>
							)}
						/>

						{/* Assistance */}
						<Controller
							name="assistanceLevel"
							control={control}
							render={({ field }) => (
								<Field>
									<FieldLabel>{t('assistance')}</FieldLabel>
									<Select
										value={field.value}
										onValueChange={field.onChange}
										disabled={fieldsDisabled}
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
								</Field>
							)}
						/>

						{/* Status (admin) */}
						{canSetStatus && (
							<Controller
								name="status"
								control={control}
								render={({ field }) => (
									<Field>
										<FieldLabel>{t('status')}</FieldLabel>
										<Select
											value={field.value}
											onValueChange={field.onChange}
											disabled={fieldsDisabled}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="pending">
													{t('reservation.statuses.pending')}
												</SelectItem>
												<SelectItem value="confirmed">
													{t('reservation.statuses.confirmed')}
												</SelectItem>
												<SelectItem value="denied">
													{t('reservation.statuses.denied')}
												</SelectItem>
												<SelectItem value="cancelled">
													{t('reservation.statuses.cancelled')}
												</SelectItem>
											</SelectContent>
										</Select>
									</Field>
								)}
							/>
						)}

						{/* Notes */}
						<Controller
							name="notes"
							control={control}
							render={({ field }) => (
								<Field>
									<FieldLabel>{t('notes')}</FieldLabel>
									<Textarea {...field} disabled={fieldsDisabled} />
								</Field>
							)}
						/>
					</FieldGroup>
				</form>
			</CardContent>

			<CardFooter>
				{mode !== 'read' && (
					<Button
						type="submit"
						form="reservation-form"
						disabled={isSubmitting}
						variant={mode === 'delete' ? 'destructive' : 'default'}
					>
						{isSubmitting
							? t('working')
							: mode === 'delete'
							? `${t('delete')} ${t('reservation.title')}`
							: mode === 'update'
							? `${t('update')} ${t('reservation.title')}`
							: `${t('create')} ${t('reservation.title')}`}
					</Button>
				)}
			</CardFooter>
		</Card>
	)
}
