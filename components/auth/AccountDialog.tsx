'use client'

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'
import { useForm, Controller } from 'react-hook-form'
import { useTransition } from 'react'
import { updateUserProfile } from '@/app/actions/update-user-profile'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

interface Props {
	open: boolean
	onOpenChange: (open: boolean) => void
	onUpdated: () => void
	details: {
		name: string | null
		username: string | null
		email: string
	}
}

type FormValues = {
	name: string
	username: string
	email: string
}

export function AccountDialog({
	open,
	onOpenChange,
	onUpdated,
	details,
}: Props) {
	const t = useTranslations('auth.account')
	const [isPending, startTransition] = useTransition()

	const { control, handleSubmit } = useForm<FormValues>({
		defaultValues: {
			name: details.name ?? '',
			username: details.username ?? '',
			email: details.email,
		},
	})

	const onSubmit = (values: FormValues) => {
		startTransition(async () => {
			try {
				await updateUserProfile(values)
				toast.success(t('updated'))

				onUpdated() // 🔑 refresh parent data
				onOpenChange(false)
			} catch {
				toast.error(t('error'))
			}
		})
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t('editTitle')}</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<Controller
						name="name"
						control={control}
						render={({ field }) => (
							<Field>
								<FieldLabel>{t('name')}</FieldLabel>
								<Input {...field} />
							</Field>
						)}
					/>

					<Controller
						name="username"
						control={control}
						render={({ field }) => (
							<Field>
								<FieldLabel>{t('username')}</FieldLabel>
								<Input {...field} />
							</Field>
						)}
					/>

					<Controller
						name="email"
						control={control}
						render={({ field }) => (
							<Field>
								<FieldLabel>{t('email')}</FieldLabel>
								<Input type="email" {...field} />
							</Field>
						)}
					/>

					<div className="flex gap-2 pt-2">
						<Button type="submit" disabled={isPending}>
							{isPending ? t('saving') : t('save')}
						</Button>

						<Button
							type="button"
							variant="secondary"
							onClick={() => onOpenChange(false)}
						>
							{t('cancel')}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}
