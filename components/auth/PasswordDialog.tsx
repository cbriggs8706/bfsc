'use client'

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useForm, Controller } from 'react-hook-form'
import { useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { changePassword } from '@/app/actions/change-password'
import { createPassword } from '@/app/actions/create-password'
import { toast } from 'sonner'

interface Props {
	open: boolean
	onOpenChange: (open: boolean) => void
	hasPassword: boolean
	onUpdated: () => void
}

type FormValues = {
	currentPassword?: string
	newPassword: string
	confirmPassword: string
}

export function PasswordDialog({
	open,
	onOpenChange,
	hasPassword,
	onUpdated,
}: Props) {
	const t = useTranslations('auth.password')
	const [isPending, startTransition] = useTransition()

	const { control, handleSubmit, reset } = useForm<FormValues>({
		defaultValues: {
			currentPassword: '',
			newPassword: '',
			confirmPassword: '',
		},
	})

	const onSubmit = (values: FormValues) => {
		if (values.newPassword !== values.confirmPassword) {
			toast.error(t('mismatch'))
			return
		}

		startTransition(async () => {
			try {
				if (hasPassword) {
					await changePassword({
						currentPassword: values.currentPassword!,
						newPassword: values.newPassword,
					})
				} else {
					await createPassword(values.newPassword)
				}

				toast.success(hasPassword ? t('updated') : t('created'))

				reset()
				onUpdated()
				onOpenChange(false)
			} catch (err) {
				console.error(err)
				toast.error(t('error'))
			}
		})
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{hasPassword ? t('changeTitle') : t('createTitle')}
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					{hasPassword && (
						<Controller
							name="currentPassword"
							control={control}
							render={({ field }) => (
								<Field>
									<FieldLabel>{t('current')}</FieldLabel>
									<Input type="password" {...field} />
								</Field>
							)}
						/>
					)}

					<Controller
						name="newPassword"
						control={control}
						render={({ field }) => (
							<Field>
								<FieldLabel>{t('new')}</FieldLabel>
								<Input type="password" {...field} />
							</Field>
						)}
					/>

					<Controller
						name="confirmPassword"
						control={control}
						render={({ field }) => (
							<Field>
								<FieldLabel>{t('confirm')}</FieldLabel>
								<Input type="password" {...field} />
							</Field>
						)}
					/>

					<div className="flex gap-2 pt-2">
						<Button type="submit" disabled={isPending}>
							{isPending
								? t('saving')
								: hasPassword
								? t('update')
								: t('create')}
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
