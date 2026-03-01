// components/resources/ReservationForm.tsx
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
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
import { ShiftType, TimeFormat } from '@/types/shifts'
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
import { Faith } from '@/types/faiths'

/* ------------------------------------------------------------------ */
/* UI Schema (matches server form shape) */
/* ------------------------------------------------------------------ */

function schema(t: (k: string) => string) {
	return z.object({
		resourceId: z.string().uuid(t('required')),
		date: z.string().min(1, t('required')),
		startTime: z.string().min(1, t('required')),
		weeklyShiftId: z.string().uuid(),
		phone: z.string().min(7, t('required')),
		isForSomeoneElse: z.boolean(),
		patronEmail: z.string().catch(''),
		attendeeCount: z.string().min(1, t('required')),
		assistanceLevel: z.enum(['none', 'startup', 'full']),
		isClosedDayRequest: z.boolean(),
		groupAffiliation: z.enum(['lds', 'other-faith', 'none']).optional(),
		locale: z.string().min(2),
		faithId: z.string().uuid().nullable().optional(),
		wardId: z.string().uuid().nullable().optional(),
		notes: z.string().catch(''),

		status: z.enum(['pending', 'confirmed', 'denied', 'cancelled']).optional(),
	}).superRefine((value, ctx) => {
		if (!value.isForSomeoneElse) return
		if (!value.patronEmail) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['patronEmail'],
				message: t('required'),
			})
			return
		}
		if (!z.string().email().safeParse(value.patronEmail).success) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['patronEmail'],
				message: t('reservation.patronEmailInvalid'),
			})
		}
	})
}

/* ------------------------------------------------------------------ */
/* Props */
/* ------------------------------------------------------------------ */

type Props = {
	locale: string
	mode: Mode
	reservationId?: string
	initialValues?: Partial<ReservationFormUIValues>
	resources: Resource[]
	faithTree: Faith[]
	timeFormat: TimeFormat
	canSetStatus?: boolean
	successRedirect?: string
}

type ReservationFormUIValues = ReservationFormValues & {
	weeklyShiftId: string
	groupAffiliation?: 'lds' | 'other-faith' | 'none'
	faithId?: string | null
	wardId?: string | null
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
	faithTree,
	timeFormat,
	canSetStatus = false,
	successRedirect,
}: Props) {
	const t = useTranslations('common')
	const router = useRouter()
	const fieldsDisabled = mode === 'read' || mode === 'delete'

	/* ---------------- form ---------------- */

	const form = useForm<ReservationFormUIValues>({
		resolver: zodResolver(schema(t)),
		defaultValues: {
			resourceId: '',
			date: '',
			phone: '',
			isForSomeoneElse: false,
			patronEmail: '',
			startTime: '',
			locale,
			attendeeCount: '1',
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
	const isForSomeoneElse = useWatch({ control, name: 'isForSomeoneElse' })
	const groupAffiliation = useWatch({ control, name: 'groupAffiliation' })

	const attendeeCountRaw = useWatch({ control, name: 'attendeeCount' })
	const attendeeCount = Number(attendeeCountRaw || 0)
	const showFaithQuestion = attendeeCount > 2
	const ldsFaith =
		faithTree.find((f) => f.name.toLowerCase().includes('latter-day')) ?? null

	useEffect(() => {
		if (!showFaithQuestion) {
			form.setValue('groupAffiliation', undefined)
			form.setValue('wardId', null)
			form.setValue('faithId', null)
			return
		}

		if (groupAffiliation === 'lds') {
			form.setValue('faithId', null)
		}

		if (groupAffiliation === 'other-faith') {
			form.setValue('wardId', null)
		}

		if (groupAffiliation === 'none') {
			form.setValue('wardId', null)
			form.setValue('faithId', null)
		}
	}, [showFaithQuestion, groupAffiliation, form])

	useEffect(() => {
		if (attendeeCount > 2) {
			form.setValue('assistanceLevel', 'full')
		}
	}, [attendeeCount, form])

	useEffect(() => {
		if (!isForSomeoneElse) {
			form.setValue('patronEmail', '')
		}
	}, [isForSomeoneElse, form])

	/* ---------------- availability ---------------- */

	const [slots, setSlots] = useState<
		{
			startTime: string
			endTime: string
			shiftType: ShiftType
			weeklyShiftId: string
		}[]
	>([])

	const [loadingSlots, setLoadingSlots] = useState(false)

	useEffect(() => {
		if (!resourceId || !date) {
			console.log('[availability] missing resourceId/date', {
				resourceId,
				date,
			})

			setSlots([])
			form.setValue('startTime', '')
			return
		}

		let cancelled = false

		async function load() {
			setLoadingSlots(true)
			try {
				const before = form.getValues('startTime')
				console.log('[availability] fetching', {
					resourceId,
					date,
					reservationId,
					before,
				})

				const res = await getAvailability({
					resourceId,
					date,
					excludeReservationId: reservationId,
				})

				if (cancelled) return

				const slotStarts = res.timeSlots.map((s) => s.startTime)

				console.log('[availability] got slots', {
					count: res.timeSlots.length,
					slotStarts,
					before,
				})

				setSlots(
					res.timeSlots.map((s) => ({
						startTime: s.startTime,
						endTime: s.endTime,
						shiftType: s.shiftType,
						weeklyShiftId: s.weeklyShiftId,
					}))
				)

				if (before && !slotStarts.includes(before)) {
					console.warn(
						'[availability] saved startTime not in availability — preserving',
						before
					)
				}
			} finally {
				if (!cancelled) setLoadingSlots(false)
			}
		}

		load()
		return () => {
			cancelled = true
		}
	}, [resourceId, date, reservationId, form])

	useEffect(() => {
		const slot = slots.find((s) => s.startTime === startTime)
		if (slot) {
			form.setValue('weeklyShiftId', slot.weeklyShiftId)
		} else {
			form.resetField('weeklyShiftId')
		}
	}, [startTime, slots, form])

	const selectedSlot = slots.find((s) => s.startTime === startTime)

	const isAppointmentSlot = selectedSlot?.shiftType === 'appointment'

	/* ---------------- submit ---------------- */

	async function onSubmit(values: ReservationFormUIValues) {
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
					<FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* Root error */}
						{errors.root && (
							<p className="text-sm text-destructive">{errors.root.message}</p>
						)}

						{/* Resource */}
						<Controller
							name="resourceId"
							control={control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid} className="col-span-2">
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
													<div className="px-2 py-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-muted/50">
														<span className="inline-block h-2 w-2 rounded-full bg-primary" />
														{t(`resource.typesP.${type}`)}
													</div>

													{items.map((r) => (
														<SelectItem
															key={r.id}
															value={r.id}
															className="pl-6"
														>
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
								<Field
									data-invalid={fieldState.invalid}
									className="col-span-2 md:col-span-1"
								>
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
								<Field
									data-invalid={fieldState.invalid}
									className="col-span-2 md:col-span-1"
								>
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
														{s.shiftType === 'appointment' && (
															<span className="ml-2 text-xs text-muted-foreground">
																({t('reservation.byAppointmentOnly')})
															</span>
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

						<input type="hidden" {...form.register('weeklyShiftId')} />

						{isAppointmentSlot && (
							<p className="text-sm md:text-base  p-6 bg-(--green-logo-soft) border border-(--green-logo) rounded-xl col-span-2">
								{t('reservation.appointmentDisclaimer')}
							</p>
						)}

						{/* Attendees */}
						<Controller
							name="attendeeCount"
							control={control}
							render={({ field }) => (
								<Field className="col-span-2 md:col-span-1">
									<FieldLabel>{t('attendees')}</FieldLabel>
									<Input
										type="number"
										min={1}
										{...field}
										disabled={fieldsDisabled}
									/>
									{/* <p className="text-xs text-muted-foreground">
										{t('reservation.attendeesSub')}
									</p> */}
								</Field>
							)}
						/>

						{/* Assistance */}
						{attendeeCount <= 4 && (
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
												<SelectItem value="none">
													{t('reservation.none')}
												</SelectItem>
												<SelectItem value="startup">
													{t('reservation.startup')}
												</SelectItem>
												<SelectItem value="full">
													{t('reservation.full')}
												</SelectItem>
											</SelectContent>
										</Select>
									</Field>
								)}
							/>
						)}

						<div className="col-span-2 flex flex-col md:flex-row gap-4">
							{' '}
							{showFaithQuestion && (
								<Controller
									name="groupAffiliation"
									control={control}
									render={({ field }) => (
										<Field>
											<FieldLabel>
												Is your group associated with a faith community?
											</FieldLabel>

											<Select
												value={field.value ?? undefined}
												onValueChange={field.onChange}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select one" />
												</SelectTrigger>

												<SelectContent>
													<SelectItem value="lds">
														Yes – Church of Jesus Christ of Latter-day Saints
													</SelectItem>
													<SelectItem value="other-faith">
														No, another faith
													</SelectItem>
													<SelectItem value="none">
														Not associated with a faith group
													</SelectItem>
												</SelectContent>
											</Select>
										</Field>
									)}
								/>
							)}
							{showFaithQuestion && groupAffiliation === 'lds' && ldsFaith && (
								<Controller
									name="wardId"
									control={control}
									render={({ field }) => (
										<Field>
											<FieldLabel>{t('reservation.selectWard')}</FieldLabel>

											<Select
												value={field.value ?? undefined}
												onValueChange={field.onChange}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select ward" />
												</SelectTrigger>

												<SelectContent>
													{ldsFaith.stakes.map((stake) => (
														<div key={stake.id}>
															<div className="px-2 py-1 text-base font-semibold text-muted-foreground">
																{stake.name} Stake
															</div>
															{stake.wards.map((ward) => (
																<SelectItem
																	key={ward.id}
																	value={ward.id}
																	className="pl-4"
																>
																	{ward.name}
																</SelectItem>
															))}
														</div>
													))}
												</SelectContent>
											</Select>
										</Field>
									)}
								/>
							)}
							{showFaithQuestion && groupAffiliation === 'other-faith' && (
								<Controller
									name="faithId"
									control={control}
									render={({ field, fieldState }) => (
										<Field data-invalid={fieldState.invalid}>
											<FieldLabel>
												<Required>{t('reservation.selectFaith')}</Required>
											</FieldLabel>

											<Select
												value={field.value ?? undefined}
												onValueChange={field.onChange}
											>
												<SelectTrigger>
													<SelectValue
														placeholder={t('reservation.selectFaith')}
													/>
												</SelectTrigger>

												<SelectContent>
													{faithTree.map((f) => (
														<SelectItem key={f.id} value={f.id}>
															{f.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>

											{fieldState.error && (
												<FieldError errors={[fieldState.error]} />
											)}
										</Field>
									)}
								/>
							)}
						</div>

						<Controller
							name="phone"
							control={control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid} className="col-span-2">
									<FieldLabel>
										<Required>{t('phone')}</Required>
									</FieldLabel>

									<Input
										type="tel"
										placeholder="(208) 555-1234"
										{...field}
										disabled={fieldsDisabled}
									/>

									<p className="text-xs text-muted-foreground">
										{t('reservation.phoneHelp')}
									</p>

									{fieldState.error && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>

						<Controller
							name="isForSomeoneElse"
							control={control}
							render={({ field }) => (
								<Field className="col-span-2">
									<div className="flex items-start gap-3 rounded-lg border p-4">
										<Checkbox
											id="is-for-someone-else"
											checked={field.value}
											onCheckedChange={(checked) =>
												field.onChange(Boolean(checked))
											}
											disabled={fieldsDisabled}
										/>
										<div className="space-y-1">
											<FieldLabel
												htmlFor="is-for-someone-else"
												className="font-medium"
											>
												{t('reservation.fillingForSomeoneElse')}
											</FieldLabel>
											<p className="text-xs text-muted-foreground">
												{t('reservation.fillingForSomeoneElseHelp')}
											</p>
										</div>
									</div>
								</Field>
							)}
						/>

						{isForSomeoneElse && (
							<Controller
								name="patronEmail"
								control={control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid} className="col-span-2">
										<FieldLabel>
											<Required>{t('reservation.patronEmail')}</Required>
										</FieldLabel>
										<Input
											type="email"
											placeholder="name@example.com"
											{...field}
											disabled={fieldsDisabled}
										/>
										{fieldState.error && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>
						)}

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
								<Field className="col-span-2">
									<FieldLabel>{t('notes')}</FieldLabel>
									<Textarea
										{...field}
										disabled={fieldsDisabled}
										placeholder="If you are filling this out for another person, make sure to put their email address here."
									/>
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
