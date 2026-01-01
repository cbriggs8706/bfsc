'use client'

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from '@/components/ui/input-otp'
import { useForm, Controller } from 'react-hook-form'
import { useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { updateKioskProfile } from '@/app/actions/update-kiosk-profile'
import { normalizePid } from '@/utils/pid'
import { toast } from 'sonner'

interface Props {
	open: boolean
	onOpenChange: (open: boolean) => void
	kioskPersonId: string
	initialPid: string
	onSaved: () => void
}

type FormValues = {
	pid: string
}

export function PidDialog({
	open,
	onOpenChange,
	kioskPersonId,
	initialPid,
	onSaved,
}: Props) {
	const t = useTranslations('auth.pid')
	const [isPending, startTransition] = useTransition()

	const { control, handleSubmit } = useForm<FormValues>({
		defaultValues: {
			pid: initialPid.replace('-', ''),
		},
	})

	const onSubmit = ({ pid }: FormValues) => {
		const normalized = normalizePid(pid)

		if (!normalized) {
			toast.error(t('invalid'))
			return
		}

		startTransition(async () => {
			try {
				await updateKioskProfile({
					kioskPersonId,
					pid: normalized,
				})

				toast.success(t('updated'))
				onSaved()
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

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
					<Controller
						name="pid"
						control={control}
						render={({ field }) => (
							<Field>
								<FieldLabel>{t('label')}</FieldLabel>

								<InputOTP
									maxLength={7}
									value={field.value}
									onChange={(value) => field.onChange(value.toUpperCase())}
								>
									<InputOTPGroup>
										{[0, 1, 2, 3].map((i) => (
											<InputOTPSlot key={i} index={i} />
										))}
									</InputOTPGroup>

									<span className="mx-2 text-muted-foreground">–</span>

									<InputOTPGroup>
										{[4, 5, 6].map((i) => (
											<InputOTPSlot key={i} index={i} />
										))}
									</InputOTPGroup>
								</InputOTP>
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
