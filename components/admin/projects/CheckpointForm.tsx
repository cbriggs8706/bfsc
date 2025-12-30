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

/* ------------------------------------------------------------------
   Form values (strings only)
------------------------------------------------------------------ */
export type CheckpointFormValues = {
	name: string
	url: string
	notes: string
	sortOrder: string
	projectId: string
}

/* ------------------------------------------------------------------ */
/* Schema (UI validation only — strings) */
/* ------------------------------------------------------------------ */

function schema(t: (k: string) => string) {
	return z.object({
		name: z.string().min(1, t('nameRequired')),
		url: z.string().url().catch(''),
		notes: z.string().catch(''),
		sortOrder: z.string().catch('0'),
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
			sortOrder: '0',
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
				successRedirect ?? `/${locale}/admin/projects/${values.projectId}`
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
			successRedirect ?? `/${locale}/admin/projects/${values.projectId}`
		)
	}

	const submitDisabled = isSubmitting || mode === 'read'

	return (
		<Card>
			<CardContent>
				<form id="project-form" onSubmit={handleSubmit(onSubmit)}>
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
						form="project-form"
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
