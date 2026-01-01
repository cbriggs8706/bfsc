'use client'

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { useEffect, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Faith } from '@/types/faiths'
import { updateKioskProfile } from '@/app/actions/update-kiosk-profile'
import { toast } from 'sonner'

interface Props {
	open: boolean
	onOpenChange: (open: boolean) => void
	kioskPersonId: string
	faithTree: Faith[]
	initialFaithId: string | null
	initialWardId: string | null
	onSaved: () => void
}

type FormValues = {
	faithId: string | ''
	wardId: string | ''
}

export function FaithDialog({
	open,
	onOpenChange,
	kioskPersonId,
	faithTree,
	initialFaithId,
	initialWardId,
	onSaved,
}: Props) {
	const t = useTranslations('auth.faith')
	const [isPending, startTransition] = useTransition()

	const { control, setValue, handleSubmit } = useForm<FormValues>({
		defaultValues: {
			faithId: initialFaithId ?? '',
			wardId: initialWardId ?? '',
		},
	})

	const selectedFaithId = useWatch({
		control,
		name: 'faithId',
	})

	const selectedFaith = faithTree.find((f) => f.id === selectedFaithId)
	const stakes = selectedFaith?.stakes ?? []

	// Reset ward when faith changes
	useEffect(() => {
		setValue('wardId', '')
	}, [selectedFaithId, setValue])

	const onSubmit = (values: FormValues) => {
		startTransition(async () => {
			try {
				await updateKioskProfile({
					kioskPersonId,
					faithId: values.faithId || null,
					wardId: values.wardId || null,
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

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<Controller
						name="faithId"
						control={control}
						render={({ field }) => (
							<Field>
								<FieldLabel>{t('faith')}</FieldLabel>
								<select {...field} className="w-full border rounded-md p-2">
									<option value="">{t('selectFaith')}</option>
									{faithTree.map((faith) => (
										<option key={faith.id} value={faith.id}>
											{faith.name}
										</option>
									))}
								</select>
							</Field>
						)}
					/>

					{stakes.length > 0 && (
						<Controller
							name="wardId"
							control={control}
							render={({ field }) => (
								<Field>
									<FieldLabel>{t('ward')}</FieldLabel>
									<select {...field} className="w-full border rounded-md p-2">
										<option value="">{t('selectWard')}</option>
										{stakes.map((stake) => (
											<optgroup key={stake.id} label={stake.name}>
												{stake.wards.map((ward) => (
													<option key={ward.id} value={ward.id}>
														{ward.name}
													</option>
												))}
											</optgroup>
										))}
									</select>
								</Field>
							)}
						/>
					)}

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
