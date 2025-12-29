'use client'

import * as React from 'react'
import { useTransition } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import {
	createResource,
	updateResource,
	deleteResource,
} from '@/lib/actions/resource/resource'

import { Card, CardContent, CardFooter } from '@/components/ui/card'
import {
	Field,
	FieldGroup,
	FieldLabel,
	FieldError,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroupTextarea } from '@/components/ui/input-group'
import { Switch } from '@/components/ui/switch'
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Required } from '@/components/Required'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mode } from '@/types/crud'

/* ------------------------------------------------------------------ */
/* ZOD — single source of truth (FORM SHAPE) */
/* ------------------------------------------------------------------ */

function resourceSchema(t: (key: string) => string) {
	return z.object({
		name: z.string().min(1, t('nameRequired')),
		type: z.enum(['equipment', 'room', 'booth', 'activity']),

		defaultDurationMinutes: z.preprocess((v) => Number(v), z.number().min(1)),

		maxConcurrent: z.preprocess((v) => Number(v), z.number().min(1)),

		// ⚠️ undefined only — NEVER null in forms
		capacity: z.preprocess(
			(v) => (v === '' ? undefined : Number(v)),
			z.number().min(1).optional()
		),

		isActive: z.boolean(),

		description: z.string().optional(),
		requiredItems: z.string().optional(),
		prep: z.string().optional(),
		notes: z.string().optional(),
		link: z.string().url().optional().or(z.literal('')),
	})
}

type BaseFormValues = z.infer<ReturnType<typeof resourceSchema>>

/* ------------------------------------------------------------------ */
/* COMPONENT */
/* ------------------------------------------------------------------ */

export function ResourceForm({
	locale,
	mode,
	initialValues,
	resourceId,
}: {
	locale: string
	mode?: Mode
	initialValues?: Partial<BaseFormValues>
	resourceId?: string
}) {
	const [pending, startTransition] = useTransition()
	const router = useRouter()
	const t = useTranslations('common')
	const disabled = mode === 'read' || mode === 'delete'

	const baseSchema = React.useMemo(() => resourceSchema(t), [t])

	const formSchema = React.useMemo(() => {
		return mode === 'read' || mode === 'delete'
			? baseSchema.partial()
			: baseSchema
	}, [baseSchema, mode])

	type FormValues = z.output<typeof baseSchema>

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: '',
			type: 'equipment',
			defaultDurationMinutes: 120,
			maxConcurrent: 1,
			capacity: undefined,
			isActive: true,
			description: '',
			requiredItems: '',
			prep: '',
			notes: '',
			link: '',
			...initialValues,
		},
	})

	const {
		control,
		handleSubmit,
		reset,
		formState: { isSubmitting },
	} = form

	const type = useWatch({ control, name: 'type' })

	async function onSubmit(values: FormValues) {
		startTransition(async () => {
			if (mode === 'delete') {
				await deleteResource(resourceId!)
				router.push(`/${locale}/admin/center/resources`)
				return
			}

			// 🔁 FORM → ACTION normalization (Library pattern)
			const payload = {
				name: values.name!,
				type: values.type!,
				defaultDurationMinutes: values.defaultDurationMinutes!,
				maxConcurrent: values.type === 'activity' ? 1 : values.maxConcurrent!,
				capacity: values.type === 'activity' ? values.capacity ?? null : null,
				isActive: values.isActive ?? true,

				description: values.description || undefined,
				requiredItems: values.requiredItems || undefined,
				prep: values.prep || undefined,
				notes: values.notes || undefined,
				link: values.link || undefined,
			}

			if (mode === 'update') {
				await updateResource(resourceId!, payload)
			} else {
				await createResource(payload)
			}

			reset()
			router.push(`/${locale}/admin/center/resources`)
		})
	}

	return (
		<Card className="w-full">
			<CardContent>
				<form id="resource-form" onSubmit={handleSubmit(onSubmit)}>
					<FieldGroup>
						{/* Name */}
						<Controller
							name="name"
							control={control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>
										<Required>{t('name')}</Required>
									</FieldLabel>
									<Input {...field} disabled={disabled} />
									{fieldState.invalid && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>

						{/* Type */}
						<Controller
							name="type"
							control={control}
							render={({ field }) => (
								<Field>
									<FieldLabel>{t('resource.type')}</FieldLabel>
									<Select
										value={field.value}
										onValueChange={field.onChange}
										disabled={disabled}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="equipment">
												{t('resource.types.equipment')}
											</SelectItem>
											<SelectItem value="room">
												{t('resource.types.room')}
											</SelectItem>
											<SelectItem value="booth">
												{t('resource.types.booth')}
											</SelectItem>
											<SelectItem value="activity">
												{t('resource.types.activity')}
											</SelectItem>
										</SelectContent>
									</Select>
								</Field>
							)}
						/>

						{/* Duration */}
						<Controller
							name="defaultDurationMinutes"
							control={control}
							render={({ field }) => (
								<Field>
									<FieldLabel>
										{t('resource.defaultDuration')} ({t('minutes')})
									</FieldLabel>
									<Input type="number" {...field} disabled={disabled} />
								</Field>
							)}
						/>

						{/* Capacity / Max Concurrent */}
						<Controller
							name={type === 'activity' ? 'capacity' : 'maxConcurrent'}
							control={control}
							render={({ field }) => (
								<Field>
									<FieldLabel>
										{type === 'activity'
											? t('resource.capacity')
											: t('resource.maxConcurrent')}
									</FieldLabel>
									<Input
										type="number"
										{...field}
										value={field.value ?? ''}
										disabled={disabled}
									/>
								</Field>
							)}
						/>

						{/* Active */}
						<Controller
							name="isActive"
							control={control}
							render={({ field }) => (
								<Field>
									<FieldLabel>{t('status')}</FieldLabel>
									<div className="flex items-center gap-2 h-10">
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
											disabled={disabled}
										/>
										<span className="text-sm">
											{field.value ? t('active') : t('inactive')}
										</span>
									</div>
								</Field>
							)}
						/>

						{/* Text Areas */}
						{(['description', 'requiredItems', 'prep', 'notes'] as const).map(
							(name) => (
								<Controller
									key={name}
									name={name}
									control={control}
									render={({ field }) => (
										<Field>
											<FieldLabel>{t(name)}</FieldLabel>
											<InputGroupTextarea
												{...field}
												rows={3}
												disabled={disabled}
											/>
										</Field>
									)}
								/>
							)
						)}

						{/* Link */}
						<Controller
							name="link"
							control={control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>{t('link')}</FieldLabel>
									<Input {...field} disabled={disabled} />
									{fieldState.invalid && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>
					</FieldGroup>
				</form>
			</CardContent>

			<CardFooter>
				{mode === 'read' && resourceId && (
					<div className="flex gap-2">
						<Link
							href={`/${locale}/admin/center/resources/update/${resourceId}`}
						>
							<Button>{t('edit')}</Button>
						</Link>
						<Link
							href={`/${locale}/admin/center/resources/delete/${resourceId}`}
						>
							<Button variant="destructive">{t('delete')}</Button>
						</Link>
					</div>
				)}

				{mode !== 'read' && (
					<Button
						type="submit"
						form="resource-form"
						variant={mode === 'delete' ? 'destructive' : 'default'}
						disabled={pending || isSubmitting}
					>
						{pending
							? 'Working…'
							: mode === 'delete'
							? `${t('delete')} ${t('resource.title')}`
							: mode === 'update'
							? `${t('update')} ${t('resource.title')}`
							: `${t('create')} ${t('resource.title')}`}
					</Button>
				)}
			</CardFooter>
		</Card>
	)
}
