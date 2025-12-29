'use client'

import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { deleteResource, saveResource } from '@/lib/actions/resource/resource'
import type { ResourceFormValues } from '@/types/resource'

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
import { Mode } from '@/types/crud'

/* ------------------------------------------------------------------ */
/* Schema (UI validation only — strings) */
/* ------------------------------------------------------------------ */

function schema(t: (k: string) => string) {
	return z.object({
		name: z.string().min(1, t('nameRequired')),
		type: z.enum(['equipment', 'room', 'booth', 'activity']),
		defaultDurationMinutes: z.string().min(1, t('required')),
		maxConcurrent: z.string().catch(''),
		capacity: z.string().catch(''),
		isActive: z.boolean(),
		description: z.string().catch(''),
		requiredItems: z.string().catch(''),
		prep: z.string().catch(''),
		notes: z.string().catch(''),
		link: z.union([z.literal(''), z.string().url(t('invalidUrl'))]).catch(''),
	})
}

/* ------------------------------------------------------------------ */
/* Props */
/* ------------------------------------------------------------------ */

type Props = {
	locale: string
	mode: Mode
	resourceId?: string
	initialValues?: Partial<ResourceFormValues>
}

/* ------------------------------------------------------------------ */
/* Component */
/* ------------------------------------------------------------------ */

export function ResourceForm({
	locale,
	mode,
	resourceId,
	initialValues,
}: Props) {
	const t = useTranslations('common')
	const router = useRouter()
	const fieldsDisabled = mode === 'read' || mode === 'delete'

	const form = useForm<ResourceFormValues>({
		resolver: zodResolver(schema(t)),
		defaultValues: {
			name: '',
			type: 'equipment',
			defaultDurationMinutes: '',
			maxConcurrent: '',
			capacity: '',
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
		setError,
		formState: { errors, isSubmitting },
	} = form

	const type = useWatch({ control, name: 'type' })

	async function onSubmit(values: ResourceFormValues) {
		if (mode === 'delete') {
			const res = await deleteResource(resourceId!)

			if (!res.ok) {
				setError('root', { message: res.message })
				return
			}

			router.push(`/${locale}/admin/center/resources`)
			return
		}

		// create / update
		const res = await saveResource(
			mode === 'update' ? 'update' : 'create',
			resourceId ?? null,
			values
		)

		if (!res.ok) {
			setError('root', { message: res.message })
			return
		}

		router.push(`/${locale}/admin/center/resources`)
	}
	const submitDisabled = isSubmitting || mode === 'read'
	return (
		<Card className="w-full">
			<CardContent>
				<form id="resource-form" onSubmit={handleSubmit(onSubmit)}>
					<FieldGroup>
						{/* Root error */}
						{errors.root && (
							<p className="text-sm text-destructive">{errors.root.message}</p>
						)}

						{/* Name */}
						<Controller
							name="name"
							control={control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>
										<Required>{t('name')}</Required>
									</FieldLabel>
									<Input {...field} disabled={fieldsDisabled} />
									{fieldState.error && (
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
										disabled={fieldsDisabled}
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
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>
										{t('resource.defaultDuration')} ({t('minutes')})
									</FieldLabel>
									<Input type="number" {...field} disabled={fieldsDisabled} />
									{fieldState.error && (
										<FieldError errors={[fieldState.error]} />
									)}
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
									<Input type="number" {...field} disabled={fieldsDisabled} />
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
											disabled={fieldsDisabled}
										/>
										<span className="text-sm">
											{field.value ? t('active') : t('inactive')}
										</span>
									</div>
								</Field>
							)}
						/>

						{/* Text areas */}
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
												disabled={fieldsDisabled}
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
									<Input {...field} disabled={fieldsDisabled} />
									{fieldState.error && (
										<FieldError errors={[fieldState.error]} />
									)}
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
						form="resource-form"
						disabled={submitDisabled}
						variant={mode === 'delete' ? 'destructive' : 'default'}
					>
						{isSubmitting
							? t('working')
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
