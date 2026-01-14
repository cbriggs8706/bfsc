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
import { updateKioskProfile } from '@/app/actions/update-kiosk-profile'
import { normalizePhoneToE164 } from '@/utils/phone'
import { toast } from 'sonner'
import type { CountryCode } from 'libphonenumber-js'

interface Props {
	open: boolean
	onOpenChange: (open: boolean) => void
	kioskPersonId: string
	initialPhone: string | null
	initialPasscode: string | null
	onSaved: () => void
	countryCode: CountryCode
}

type FormValues = {
	phone: string
	passcode: string
}

export function KioskAccessDialog({
	open,
	onOpenChange,
	kioskPersonId,
	initialPhone,
	initialPasscode,
	onSaved,
	countryCode,
}: Props) {
	const t = useTranslations('auth.kiosk')
	const [isPending, startTransition] = useTransition()

	const { control, handleSubmit, setValue } = useForm<FormValues>({
		defaultValues: {
			phone: initialPhone ?? '',
			passcode: initialPasscode ?? '',
		},
	})

	const generatePasscode = () => {
		setValue('passcode', Math.floor(100000 + Math.random() * 900000).toString())
	}

	const onSubmit = (values: FormValues) => {
		const normalizedPhone = values.phone
			? normalizePhoneToE164(values.phone, countryCode)
			: null

		if (values.phone && !normalizedPhone) {
			toast.error(t('invalidPhone'))
			return
		}

		if (values.passcode && !/^\d{6}$/.test(values.passcode)) {
			toast.error(t('invalidPasscode'))
			return
		}

		startTransition(async () => {
			try {
				await updateKioskProfile({
					kioskPersonId,
					phone: normalizedPhone,
					passcode: values.passcode || null,
				})

				toast.success(t('updated'))
				onSaved()
			} catch (err: unknown) {
				if (
					err instanceof Error &&
					err.message.includes('kiosk_people_passcode')
				) {
					toast.error(t('passcodeInUse'))
				} else {
					toast.error(t('error'))
				}
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
						name="phone"
						control={control}
						render={({ field }) => (
							<Field>
								<FieldLabel>{t('phone')}</FieldLabel>
								<Input {...field} placeholder="555-123-4567" />
							</Field>
						)}
					/>

					<Controller
						name="passcode"
						control={control}
						render={({ field }) => (
							<Field>
								<FieldLabel>{t('passcode')}</FieldLabel>
								<Input
									{...field}
									inputMode="numeric"
									maxLength={6}
									onChange={(e) =>
										field.onChange(e.target.value.replace(/\D/g, ''))
									}
								/>
								<Button
									type="button"
									variant="secondary"
									size="sm"
									className="mt-2"
									onClick={generatePasscode}
								>
									{t('generate')}
								</Button>
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
