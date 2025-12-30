'use client'

import { useRouter } from 'next/navigation'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { saveProject, deleteProject } from '@/lib/actions/projects/projects'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
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
export type ProjectFormValues = {
	name: string
	sortOrder: string
	instructions: string
	difficulty: string
	specific: string
	measurable: string
	achievable: string
	relevant: string

	targetDate: string
	actualCompletionDate: string

	isArchived: boolean
}

/* ------------------------------------------------------------------ */
/* Schema (UI validation only — strings) */
/* ------------------------------------------------------------------ */

function schema(t: (k: string) => string) {
	return z.object({
		name: z.string().min(1, t('nameRequired')),
		sortOrder: z.string().min(1, t('required')),
		difficulty: z.string().catch(''),
		instructions: z.string().catch(''),
		specific: z.string().catch(''),
		measurable: z.string().catch(''),
		achievable: z.string().catch(''),
		relevant: z.string().catch(''),
		targetDate: z.string().catch(''),
		actualCompletionDate: z.string().catch(''),
		isArchived: z.boolean(),
	})
}

type Props = {
	locale: string
	mode: Mode
	projectId?: string
	initialValues?: ProjectFormValues
	successRedirect?: string
}

export function ProjectForm({
	locale,
	mode,
	projectId,
	initialValues,
	successRedirect,
}: Props) {
	const t = useTranslations('common')
	const router = useRouter()
	const fieldsDisabled = mode === 'read' || mode === 'delete'

	// const [isPending, startTransition] = useTransition()

	const form = useForm<ProjectFormValues>({
		resolver: zodResolver(schema(t)),
		defaultValues: {
			name: '',
			sortOrder: '0',
			difficulty: '',
			instructions: '',
			specific: '',
			measurable: '',
			achievable: '',
			relevant: '',
			targetDate: '',
			actualCompletionDate: '',
			isArchived: false,
			...initialValues,
		},
	})

	const {
		control,
		handleSubmit,
		setError,
		formState: { errors, isSubmitting },
	} = form

	// const type = useWatch({ control, name: 'type' })

	// const isArchived = useWatch({
	// 	control: form.control,
	// 	name: 'isArchived',
	// })

	/* ------------------------------------------------------------------
	   Load (form owns server call)
	------------------------------------------------------------------ */
	// useEffect(() => {
	// 	if (!id || initialValues) return

	// 	if (mode === 'update' || mode === 'read' || mode === 'delete') {
	// 		startTransition(async () => {
	// 			const data = await readProjectForForm(id)
	// 			if (data) {
	// 				form.reset(data)
	// 			}
	// 		})
	// 	}
	// }, [id, mode, initialValues, form])

	/* ------------------------------------------------------------------
	   Submit
	------------------------------------------------------------------ */
	async function onSubmit(values: ProjectFormValues) {
		if (mode === 'delete') {
			const res = await deleteProject(projectId!)

			if (!res.ok) {
				setError('root', { message: res.message })
				return
			}

			router.push(successRedirect ?? `/${locale}/admin/projects`)
			return
		}

		const res = await saveProject(
			mode === 'update' ? 'update' : 'create',
			projectId ?? null,
			values
		)

		if (!res.ok) {
			setError('root', { message: res.message })
			return
		}

		router.push(successRedirect ?? `/${locale}/admin/projects`)
	}

	const submitDisabled = isSubmitting || mode === 'read'

	return (
		<Card>
			{/* <CardHeader>
				<CardTitle>
					{mode === 'create' && 'Create Project'}
					{mode === 'update' && 'Edit Project'}
					{mode === 'read' && 'Project'}
					{mode === 'delete' && 'Delete Project'}
				</CardTitle>
			</CardHeader> */}

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

						{(
							[
								'instructions',
								'specific',
								'measurable',
								'achievable',
								'relevant',
							] as const
						).map((name) => (
							<Controller
								key={name}
								name={name}
								control={control}
								render={({ field }) => (
									<Field>
										<FieldLabel>{t(`projects.${name}`)}</FieldLabel>
										<InputGroupTextarea
											{...field}
											rows={5}
											disabled={fieldsDisabled}
											placeholder={`${t(`projects.${name}Placeholder`)}`}
										/>
									</Field>
								)}
							/>
						))}

						{/* Date */}
						<Controller
							name="targetDate"
							control={control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>
										<Required>{t('projects.targetDate')}</Required>
									</FieldLabel>
									<Input type="date" {...field} disabled={fieldsDisabled} />
									{fieldState.error && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>

						{/* Date */}
						<Controller
							name="actualCompletionDate"
							control={control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>{t('projects.completionDate')}</FieldLabel>
									<Input type="date" {...field} disabled={fieldsDisabled} />
									{fieldState.error && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>
						{/* SortOrder */}
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

						{/* Active */}
						<Controller
							name="isArchived"
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
											{field.value ? t('archived') : t('inProgress')}
										</span>
									</div>
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
