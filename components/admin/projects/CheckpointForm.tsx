'use client'

import { useRouter } from 'next/navigation'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { useTranslations } from 'next-intl'
import { Mode } from '@/types/crud'
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from '@/components/ui/field'
import { Required } from '@/components/Required'
import {
	deleteCheckpoint,
	saveCheckpoint,
} from '@/lib/actions/projects/checkpoints'
import { InputGroupTextarea } from '@/components/ui/input-group'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'

/* ------------------------------------------------------------------
   Form values (strings only)
------------------------------------------------------------------ */
export type CheckpointFormValues = {
	name: string
	url: string
	notes: string
	sortOrder: string
	estimatedDuration: string
	difficulty: string
	projectId: string
}

/* ------------------------------------------------------------------ */
/* Schema (UI validation only — strings) */
/* ------------------------------------------------------------------ */

function schema(t: (k: string) => string) {
	return z.object({
		name: z.string().min(1, t('nameRequired')),
		url: z.union([z.literal(''), z.string().url()]).catch(''),
		notes: z.string().catch(''),
		difficulty: z.string().catch(''),
		sortOrder: z.string().catch('0'),
		estimatedDuration: z.string().catch('1'),
		projectId: z.string().uuid(''),
	})
}

type Props = {
	locale: string
	mode: Mode
	checkpointId?: string
	initialValues?: CheckpointFormValues
	successRedirect?: string
}

export function CheckpointForm({
	locale,
	mode,
	checkpointId,
	initialValues,
	successRedirect,
}: Props) {
	const t = useTranslations('common')
	const router = useRouter()
	const fieldsDisabled = mode === 'read' || mode === 'delete'

	const form = useForm<CheckpointFormValues>({
		resolver: zodResolver(schema(t)),
		defaultValues: {
			name: '',
			url: '',
			notes: '',
			difficulty: '',
			sortOrder: '0',
			estimatedDuration: '1',
			projectId: '',
			...initialValues,
		},
	})

	const {
		control,
		handleSubmit,
		setError,
		formState: { errors, isSubmitting },
	} = form

	// const projectId = useWatch({ control, name: 'projectId' })

	/* ------------------------------------------------------------------
	   Submit
	------------------------------------------------------------------ */
	async function onSubmit(values: CheckpointFormValues) {
		// DELETE
		if (mode === 'delete') {
			const res = await deleteCheckpoint(checkpointId!, values.projectId)

			if (!res.ok) {
				setError('root', { message: res.message })
				return
			}

			router.push(
				successRedirect ??
					`/${locale}/admin/projects/${values.projectId}/checkpoints`
			)
			return
		}

		// CREATE / UPDATE
		const res = await saveCheckpoint(
			mode === 'update' ? 'update' : 'create',
			checkpointId ?? null,
			values
		)

		if (!res.ok) {
			setError('root', { message: res.message })
			return
		}

		router.push(
			successRedirect ??
				`/${locale}/admin/projects/${values.projectId}/checkpoints`
		)
	}

	const submitDisabled = isSubmitting || mode === 'read'

	return (
		<Card>
			<CardContent>
				<form id="checkpoint-form" onSubmit={handleSubmit(onSubmit)}>
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
							name="difficulty"
							control={control}
							render={({ field }) => (
								<Field>
									<FieldLabel>{t('projects.difficulty.title')}</FieldLabel>
									<Select
										value={field.value}
										onValueChange={field.onChange}
										disabled={fieldsDisabled}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="easy">
												{t('projects.difficulty.easy')}
											</SelectItem>
											<SelectItem value="medium">
												{t('projects.difficulty.medium')}
											</SelectItem>
											<SelectItem value="difficult">
												{t('projects.difficulty.difficult')}
											</SelectItem>
										</SelectContent>
									</Select>
								</Field>
							)}
						/>

						{/* URL */}
						<Controller
							name="url"
							control={control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>{t('url')}</FieldLabel>
									<Input {...field} disabled={fieldsDisabled} />
									{fieldState.error && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>
						{/* Notes */}
						<Controller
							name="notes"
							control={control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>{t('notes')}</FieldLabel>
									<InputGroupTextarea
										{...field}
										rows={5}
										disabled={fieldsDisabled}
									/>
									{fieldState.error && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>

						{/* Estimated Duration */}
						<Controller
							name="estimatedDuration"
							control={control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>{t('projects.estimatedDuration')}</FieldLabel>
									<Input type="number" {...field} disabled={fieldsDisabled} />
									{fieldState.error && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>

						{/* Sort Order */}
						<Controller
							name="sortOrder"
							control={control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>{t('sortOrder')}</FieldLabel>
									<Input type="number" {...field} disabled={fieldsDisabled} />
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
						form="checkpoint-form"
						disabled={submitDisabled}
						variant={mode === 'delete' ? 'destructive' : 'default'}
					>
						{isSubmitting
							? t('working')
							: mode === 'delete'
							? `${t('delete')} ${t('projects.checkpoint')}`
							: mode === 'update'
							? `${t('update')} ${t('projects.checkpoint')}`
							: `${t('create')} ${t('projects.checkpoint')}`}
					</Button>
				)}
			</CardFooter>
		</Card>
	)
}
