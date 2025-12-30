'use client'

import { useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import {
	readCheckpointContributionForForm,
	saveCheckpointContribution,
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
	minutesSpent: z.string().regex(/^\d+$/, 'Must be a number').min(1),
	notes: z.string().catch(''),
	url: z.union([z.literal(''), z.string().url()]).catch(''),
})

type Props = {
	mode: CheckpointFormMode
	checkpointId: string
	projectId: string
	locale: string
}

export function CheckpointContributionForm({
	mode,
	checkpointId,
	projectId,
	locale,
}: Props) {
	const router = useRouter()
	const [isPending, startTransition] = useTransition()
	const disabled = isPending || mode === 'read'

	const form = useForm<CheckpointFormValues>({
		resolver: zodResolver(CheckpointFormSchema),
		defaultValues: EMPTY,
	})

	const onSubmit = (
		values: CheckpointFormValues,
		event?: React.BaseSyntheticEvent
	) => {
		if (mode === 'read') return

		const submitter = (event?.nativeEvent as SubmitEvent)
			?.submitter as HTMLButtonElement | null

		const markComplete = submitter?.dataset.intent === 'logAndComplete'

		startTransition(async () => {
			const res = await saveCheckpointContribution(
				checkpointId,
				values,
				locale,
				{ markComplete }
			)

			if (res.ok) {
				router.push(`/${locale}/projects/${projectId}`)
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
							disabled={disabled}
							{...form.register('minutesSpent')}
						/>
					</div>

					<div>
						<Label>Notes</Label>
						<Textarea
							disabled={disabled}
							{...form.register('notes')}
							placeholder="optional"
						/>
					</div>

					<div>
						<Label>Related URL</Label>
						<Input
							disabled={disabled}
							{...form.register('url')}
							placeholder="optional"
						/>
					</div>

					<div className="flex gap-2 justify-between">
						<Button type="submit" disabled={isPending} data-intent="log">
							Log Time Only
						</Button>

						<Button
							type="submit"
							disabled={isPending}
							variant="default"
							data-intent="logAndComplete"
						>
							Log Time & Mark Complete
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	)
}
