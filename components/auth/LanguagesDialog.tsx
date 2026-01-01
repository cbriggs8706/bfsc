'use client'

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { useForm, Controller } from 'react-hook-form'
import { useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { updateKioskProfile } from '@/app/actions/update-kiosk-profile'
import { toast } from 'sonner'

export const LANGUAGE_OPTIONS: {
	category: string
	languages: string[]
}[] = [
	{
		category: 'Global / Widely Spoken',
		languages: [
			'English',
			'Spanish',
			'Mandarin Chinese',
			'Hindi',
			'Arabic',
			'Portuguese',
			'Bengali',
			'Russian',
			'Japanese',
			'French',
		],
	},
	{
		category: 'European',
		languages: [
			'German',
			'Dutch',
			'Italian',
			'Polish',
			'Greek',
			'Swedish',
			'Norwegian',
			'Danish',
			'Finnish',
			'Icelandic',
		],
	},
	{
		category: 'Middle East & Africa',
		languages: [
			'Hebrew',
			'Persian (Farsi)',
			'Amharic',
			'Swahili',
			'Somali',
			'Afrikaans',
			'Yoruba',
			'Zulu',
		],
	},
	{
		category: 'South & Southeast Asia',
		languages: [
			'Urdu',
			'Punjabi',
			'Tamil',
			'Telugu',
			'Vietnamese',
			'Thai',
			'Indonesian',
			'Filipino (Tagalog)',
		],
	},
	{
		category: 'Indigenous & Regional',
		languages: ['Quechua', 'Guarani', 'Nahuatl', 'Maya'],
	},
	{
		category: 'Sign & Accessibility Languages',
		languages: [
			'American Sign Language (ASL)',
			'British Sign Language (BSL)',
			'International Sign',
		],
	},
]
interface Props {
	open: boolean
	onOpenChange: (open: boolean) => void
	kioskPersonId: string
	initialLanguages: string[]
	onSaved: () => void
}

type FormValues = {
	languages: string[]
}

export function LanguagesDialog({
	open,
	onOpenChange,
	kioskPersonId,
	initialLanguages,
	onSaved,
}: Props) {
	const t = useTranslations('auth.languages')
	const [isPending, startTransition] = useTransition()

	const { control, handleSubmit } = useForm<FormValues>({
		defaultValues: {
			languages: initialLanguages,
		},
	})

	const onSubmit = (values: FormValues) => {
		startTransition(async () => {
			try {
				await updateKioskProfile({
					kioskPersonId,
					languagesSpoken: values.languages,
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
			<DialogContent className="max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{t('editTitle')}</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
					<Controller
						name="languages"
						control={control}
						render={({ field }) => (
							<Field>
								<FieldLabel>{t('label')}</FieldLabel>

								<div className="space-y-4">
									{LANGUAGE_OPTIONS.map((group) => (
										<div key={group.category}>
											<p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
												{group.category}
											</p>

											<div className="grid grid-cols-2 gap-2">
												{group.languages.map((lang) => (
													<label
														key={lang}
														className="flex items-center gap-2 text-sm"
													>
														<input
															type="checkbox"
															checked={field.value.includes(lang)}
															onChange={(e) => {
																if (e.target.checked) {
																	field.onChange([...field.value, lang])
																} else {
																	field.onChange(
																		field.value.filter((l) => l !== lang)
																	)
																}
															}}
														/>
														{lang}
													</label>
												))}
											</div>
										</div>
									))}
								</div>
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
