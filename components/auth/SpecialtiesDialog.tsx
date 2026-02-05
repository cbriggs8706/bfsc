'use client'

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { InputGroupTextarea } from '@/components/ui/input-group'
import { useForm, Controller } from 'react-hook-form'
import { useMemo, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { updateKioskProfile } from '@/app/actions/update-kiosk-profile'
import { toast } from 'sonner'

export const SPECIALTY_OPTIONS: {
	category: string
	specialties: string[]
}[] = [
	{
		category: 'Research Regions',
		specialties: [
			'Danish research',
			'Norwegian research',
			'Swedish research',
			'English research',
			'German research',
			'Italian research',
			'Spanish research',
			'Native American research',
			'Germany, Netherlands, and French Canadian research',
			'England research (FindMyPast)',
		],
	},
	{
		category: 'Tools & Databases',
		specialties: [
			'RootsMagic',
			'Ancestry',
			'FamilySearch research assistance',
			'Find a Grave',
			'BillionGraves transcription',
			'Indexing and name review',
			'Indexing',
			'Using Audacity (audio editing)',
		],
	},
	{
		category: 'Translation & Writing',
		specialties: [
			'Old Gothic writing translation',
			'Italian and Spanish translation',
			'German translation',
			'French translation',
			'Portuguese translation',
			'Danish translation',
			'Swedish translation',
		],
	},
]

interface Props {
	open: boolean
	onOpenChange: (open: boolean) => void
	kioskPersonId: string
	initialSpecialties: string[]
	onSaved: () => void
}

type FormValues = {
	selected: string[]
	customText: string
}

function normalizeSpecialties(values: string[]) {
	const map = new Map<string, string>()
	for (const value of values) {
		const trimmed = value.trim()
		if (!trimmed) continue
		const key = trimmed.toLowerCase()
		if (!map.has(key)) map.set(key, trimmed)
	}
	return Array.from(map.values())
}

export function SpecialtiesDialog({
	open,
	onOpenChange,
	kioskPersonId,
	initialSpecialties,
	onSaved,
}: Props) {
	const t = useTranslations('auth.specialties')
	const [isPending, startTransition] = useTransition()

	const allOptions = useMemo(
		() => SPECIALTY_OPTIONS.flatMap((group) => group.specialties),
		[]
	)

	const defaultSelected = useMemo(
		() =>
			initialSpecialties.filter((specialty) =>
				allOptions.includes(specialty)
			),
		[allOptions, initialSpecialties]
	)

	const defaultCustom = useMemo(
		() =>
			initialSpecialties
				.filter((specialty) => !allOptions.includes(specialty))
				.join('\n'),
		[allOptions, initialSpecialties]
	)

	const { control, handleSubmit } = useForm<FormValues>({
		defaultValues: {
			selected: defaultSelected,
			customText: defaultCustom,
		},
	})

	const onSubmit = (values: FormValues) => {
		const customItems = values.customText
			.split(/[\n,]/)
			.map((item) => item.trim())
			.filter(Boolean)

		const specialties = normalizeSpecialties([
			...values.selected,
			...customItems,
		])

		startTransition(async () => {
			try {
				await updateKioskProfile({
					kioskPersonId,
					researchSpecialties: specialties,
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
						name="selected"
						control={control}
						render={({ field }) => (
							<Field>
								<FieldLabel>{t('label')}</FieldLabel>

								<div className="space-y-4">
									{SPECIALTY_OPTIONS.map((group) => (
										<div key={group.category}>
											<p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
												{group.category}
											</p>

											<div className="grid grid-cols-1 gap-2 md:grid-cols-2">
												{group.specialties.map((specialty) => (
													<label
														key={specialty}
														className="flex items-center gap-2 text-sm"
													>
														<input
															type="checkbox"
															checked={field.value.includes(specialty)}
															onChange={(e) => {
																if (e.target.checked) {
																	field.onChange([
																		...field.value,
																		specialty,
																	])
																} else {
																	field.onChange(
																		field.value.filter((s) => s !== specialty)
																	)
																}
															}}
														/>
														{specialty}
													</label>
												))}
											</div>
										</div>
									))}
								</div>
							</Field>
						)}
					/>

					<Controller
						name="customText"
						control={control}
						render={({ field }) => (
							<Field>
								<FieldLabel>{t('customLabel')}</FieldLabel>
								<InputGroupTextarea
									{...field}
									placeholder={t('customPlaceholder')}
									rows={4}
								/>
								<p className="text-xs text-muted-foreground mt-2">
									{t('customHint')}
								</p>
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
