'use client'

import { useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import {
	readCheckpointCompletionForForm,
	saveCheckpointCompletion,
} from '@/lib/actions/projects/front-checkpoints'
import type { CheckpointFormMode, CheckpointFormValues } from '@/types/projects'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

const EMPTY: CheckpointFormValues = {
	minutesSpent: '1',
	notes: '',
	url: '',
}

const CheckpointFormSchema = z.object({
	minutesSpent: z.string().min(1),
	notes: z.string().catch(''),
	url: z.union([z.literal(''), z.string().url()]).catch(''),
})

type Props = {
	mode: CheckpointFormMode
	checkpointId: string
	projectId: string
	locale: string
}

export function CheckpointCompletionForm({
	mode,
	checkpointId,
	projectId,
	locale,
}: Props) {
	const router = useRouter()
	const [isPending, startTransition] = useTransition()

	const form = useForm<CheckpointFormValues>({
		resolver: zodResolver(CheckpointFormSchema),
		defaultValues: EMPTY,
	})

	useEffect(() => {
		if (mode === 'read') return

		startTransition(async () => {
			const data = await readCheckpointCompletionForForm(checkpointId)
			if (data) form.reset(data)
		})
	}, [checkpointId, mode, form])

	const onSubmit = (values: CheckpointFormValues) => {
		if (mode === 'read') return

		startTransition(async () => {
			const res = await saveCheckpointCompletion(
				mode === 'create' ? 'create' : 'update',
				checkpointId,
				values,
				locale
			)

			if (res.ok) {
				router.push(`/${locale}/projects/${projectId}`)
				// router.refresh()
			}
		})
	}

	return (
		<Card>
			<CardContent>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
					<div>
						<Label>Minutes Spent</Label>
						<Input
							type="number"
							disabled={isPending}
							{...form.register('minutesSpent')}
						/>
					</div>

					<div>
						<Label>Notes</Label>
						<Textarea
							disabled={isPending}
							{...form.register('notes')}
							placeholder="optional"
						/>
					</div>

					<div>
						<Label>Related URL</Label>
						<Input
							disabled={isPending}
							{...form.register('url')}
							placeholder="optional"
						/>
					</div>

					<Button disabled={isPending}>Mark Checkpoint as Completed</Button>
				</form>
			</CardContent>
		</Card>
	)
}
