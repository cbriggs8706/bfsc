'use client'

import { useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import {
	readProjectForForm,
	saveProject,
	deleteProject,
} from '@/lib/actions/projects/projects'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/* ------------------------------------------------------------------
   Form values (strings only)
------------------------------------------------------------------ */
export type ProjectFormValues = {
	name: string
	instructions: string

	specific: string
	measurable: string
	achievable: string
	relevant: string

	targetDate: string
	actualCompletionDate: string

	isArchived: boolean
}

/* ------------------------------------------------------------------
   UI schema MUST match FormValues EXACTLY
------------------------------------------------------------------ */
const ProjectFormSchema = z.object({
	name: z.string().min(1),

	instructions: z.string().catch(''),

	specific: z.string().catch(''),
	measurable: z.string().catch(''),
	achievable: z.string().catch(''),
	relevant: z.string().catch(''),

	targetDate: z.string().catch(''),
	actualCompletionDate: z.string().catch(''),

	isArchived: z.boolean(),
})

type Props = {
	mode: 'create' | 'update' | 'read' | 'delete'
	id?: string
	locale: string
	initialValues?: ProjectFormValues
	successRedirect?: string
}

const EMPTY: ProjectFormValues = {
	name: '',
	instructions: '',

	specific: '',
	measurable: '',
	achievable: '',
	relevant: '',

	targetDate: '',
	actualCompletionDate: '',

	isArchived: false,
}

export function ProjectForm({
	mode,
	id,
	locale,
	initialValues,
	successRedirect,
}: Props) {
	const router = useRouter()
	const [isPending, startTransition] = useTransition()

	const isReadOnly = mode === 'read' || mode === 'delete'

	const form = useForm<ProjectFormValues>({
		resolver: zodResolver(ProjectFormSchema),
		defaultValues: initialValues ?? EMPTY,
	})

	const isArchived = useWatch({
		control: form.control,
		name: 'isArchived',
	})

	/* ------------------------------------------------------------------
	   Load (form owns server call)
	------------------------------------------------------------------ */
	useEffect(() => {
		if (!id || initialValues) return

		if (mode === 'update' || mode === 'read' || mode === 'delete') {
			startTransition(async () => {
				const data = await readProjectForForm(id)
				if (data) {
					form.reset(data)
				}
			})
		}
	}, [id, mode, initialValues, form])

	/* ------------------------------------------------------------------
	   Submit
	------------------------------------------------------------------ */
	const onSubmit = (values: ProjectFormValues) => {
		startTransition(async () => {
			if (mode === 'delete') {
				const res = await deleteProject(id!)
				if (res.ok) {
					router.push(successRedirect ?? `/${locale}/admin/projects`)
				}
				return
			}

			if (mode === 'read') {
				return
			}

			// ✅ mode is now narrowed to 'create' | 'update'
			const res = await saveProject(mode, id ?? null, values)

			if (res.ok) {
				router.push(successRedirect ?? `/${locale}/admin/projects`)
			}
		})
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					{mode === 'create' && 'Create Project'}
					{mode === 'update' && 'Edit Project'}
					{mode === 'read' && 'Project'}
					{mode === 'delete' && 'Delete Project'}
				</CardTitle>
			</CardHeader>

			<CardContent>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
					<div>
						<Label>Name</Label>
						<Input
							disabled={isReadOnly || isPending}
							{...form.register('name')}
						/>
					</div>

					<div>
						<Label>Instructions</Label>
						<Textarea
							disabled={isReadOnly || isPending}
							{...form.register('instructions')}
						/>
					</div>

					<div>
						<Label>Specific</Label>
						<Textarea disabled={isReadOnly} {...form.register('specific')} />
					</div>

					<div>
						<Label>Measurable</Label>
						<Textarea disabled={isReadOnly} {...form.register('measurable')} />
					</div>

					<div>
						<Label>Achievable</Label>
						<Textarea disabled={isReadOnly} {...form.register('achievable')} />
					</div>

					<div>
						<Label>Relevant</Label>
						<Textarea disabled={isReadOnly} {...form.register('relevant')} />
					</div>

					<div>
						<Label>Goal Date</Label>
						<Input
							type="date"
							disabled={isReadOnly}
							{...form.register('targetDate')}
						/>
					</div>

					<div>
						<Label>Actual Completion</Label>
						<Input
							type="date"
							disabled={isReadOnly}
							{...form.register('actualCompletionDate')}
						/>
					</div>

					<div className="flex items-center justify-between">
						<Label>Archived</Label>
						<Switch
							checked={isArchived}
							onCheckedChange={(v) =>
								form.setValue('isArchived', v, { shouldDirty: true })
							}
							disabled={isReadOnly}
						/>
					</div>

					{mode !== 'read' && (
						<Button disabled={isPending}>
							{mode === 'create' && 'Create'}
							{mode === 'update' && 'Update'}
							{mode === 'delete' && 'Delete'}
						</Button>
					)}
				</form>
			</CardContent>
		</Card>
	)
}
