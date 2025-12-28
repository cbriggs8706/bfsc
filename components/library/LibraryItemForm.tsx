// components/library/LibraryItemForm.tsx
'use client'

import * as React from 'react'
import { useTransition } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import {
	createLibraryItem,
	updateLibraryItem,
	deleteLibraryItem,
} from '@/lib/actions/library/library-actions'

import { Card, CardContent, CardFooter } from '@/components/ui/card'
import {
	Field,
	FieldGroup,
	FieldLabel,
	FieldDescription,
	FieldError,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from '@/components/ui/select'
import { InputGroupTextarea } from '@/components/ui/input-group'
import { Button } from '@/components/ui/button'
import { Required } from '../Required'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Mode } from '@/types/crud'
import Link from 'next/link'

/* ---------------- ZOD = SINGLE SOURCE OF TRUTH ---------------- */

function createFormSchema(t: (key: string) => string) {
	return z.object({
		type: z.enum(['book', 'equipment']),
		name: z.string().min(1, t('nameRequired')),
		description: z.string().min(1, t('descriptionRequired')),
		copyCodesText: z.string().min(1, t('atLeast1CopyCode')),
		year: z.string().optional(),
		authorManufacturer: z.string().optional(),
		isbn: z.string().optional(),
		notes: z.string().optional(),
		tagsText: z.string().optional(),
	})
}

/* ---------------- COMPONENT ---------------- */
type BaseFormValues = z.infer<ReturnType<typeof createFormSchema>>

export function LibraryItemForm({
	userId,
	locale,
	mode,
	initialValues,
	itemId,
}: {
	userId: string
	locale: string
	mode?: Mode
	initialValues?: Partial<BaseFormValues>
	itemId?: string
}) {
	const [pending, startTransition] = useTransition()

	const router = useRouter()
	const t = useTranslations('common')
	const disabled = mode === 'read' || mode === 'delete'

	const formSchema = React.useMemo(() => {
		const base = createFormSchema(t)
		if (mode === 'read' || mode === 'delete') {
			return base.partial()
		}
		return base
	}, [t, mode])

	type FormValues = z.infer<typeof formSchema>
	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			type: 'book',
			name: '',
			description: '',
			copyCodesText: '',
			year: '',
			authorManufacturer: '',
			isbn: '',
			notes: '',
			tagsText: '',
			...initialValues,
		},
	})

	const {
		control,
		handleSubmit,
		setError,
		reset,
		formState: { isSubmitting },
	} = form

	const type = useWatch({
		control,
		name: 'type',
	})

	async function onSubmit(values: FormValues) {
		startTransition(async () => {
			if (mode === 'delete') {
				await deleteLibraryItem(itemId!)
				router.push(`/${locale}/library`)
				return
			}

			const {
				type,
				name,
				description,
				copyCodesText,
				year,
				authorManufacturer,
				isbn,
				notes,
				tagsText,
			} = values as Required<
				Pick<BaseFormValues, 'type' | 'name' | 'description' | 'copyCodesText'>
			> &
				BaseFormValues

			const payload = {
				type,
				name,
				description,
				year: year ? Number(year) : undefined,
				authorManufacturer: authorManufacturer || undefined,
				isbn: isbn || undefined,
				notes: notes || undefined,
				copyCodes: copyCodesText
					.split('\n')
					.map((v) => v.trim())
					.filter(Boolean),
				tags:
					tagsText
						?.split('\n')
						.map((v) => v.trim())
						.filter(Boolean) ?? [],
			}

			const result =
				mode === 'update'
					? await updateLibraryItem(itemId!, payload)
					: await createLibraryItem(userId, payload)

			if (!result.ok) {
				if (result.fieldErrors?.copyCodesText) {
					setError('copyCodesText', { type: 'server' })
					return
				}
			}

			reset()
			router.push(`/${locale}/library`)
		})
	}

	return (
		<Card className="w-full">
			<CardContent>
				<form id="library-item-form" onSubmit={handleSubmit(onSubmit)}>
					<FieldGroup>
						{/* Type */}
						<Controller
							name="type"
							control={control}
							render={({ field }) => (
								<Field>
									<FieldLabel>Type</FieldLabel>
									<Select
										value={field.value}
										onValueChange={field.onChange}
										disabled={disabled}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="book">{t('book')}</SelectItem>
											<SelectItem value="equipment">
												{t('equipment')}
											</SelectItem>
										</SelectContent>
									</Select>
								</Field>
							)}
						/>

						{/* Name */}
						<Controller
							name="name"
							control={control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>
										<Required>{t('name')}</Required>
									</FieldLabel>
									<Input {...field} disabled={disabled} />
									{fieldState.invalid && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>

						{/* Description */}
						<Controller
							name="description"
							control={control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>
										<Required>{t('description')}</Required>
									</FieldLabel>
									<InputGroupTextarea {...field} rows={4} disabled={disabled} />
									{fieldState.invalid && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>

						{/* Copy Codes */}
						<Controller
							name="copyCodesText"
							control={control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>
										<Required>{t('copyCodes')}</Required>
									</FieldLabel>

									<InputGroupTextarea
										{...field}
										rows={4}
										disabled={disabled}
										placeholder={`Book1589\nUSB-024\n928398273502935`}
									/>

									<FieldDescription>{t('copyCodesSub')}</FieldDescription>
									{fieldState.invalid && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>

						{/* Year */}
						<Controller
							name="year"
							control={control}
							render={({ field }) => (
								<Field>
									<FieldLabel>{t('year')}</FieldLabel>
									<Input
										type="number"
										{...field}
										placeholder={`1972`}
										disabled={disabled}
									/>
								</Field>
							)}
						/>

						{/* Author / Manufacturer */}
						<Controller
							name="authorManufacturer"
							control={control}
							render={({ field }) => (
								<Field>
									<FieldLabel>
										{type === 'book' ? `${t('author')}` : `${t('brandManuf')}`}
									</FieldLabel>
									<Input
										{...field}
										disabled={disabled}
										placeholder={`${t('lastName')}, ${t('firstName')}`}
									/>
								</Field>
							)}
						/>

						{/* ISBN */}
						{type === 'book' && (
							<Controller
								name="isbn"
								control={control}
								render={({ field }) => (
									<Field>
										<FieldLabel>{t('isbn')}</FieldLabel>
										<Input {...field} disabled={disabled} />
									</Field>
								)}
							/>
						)}

						{/* Notes */}
						<Controller
							name="notes"
							control={control}
							render={({ field }) => (
								<Field>
									<FieldLabel>{t('notes')}</FieldLabel>
									<InputGroupTextarea {...field} rows={3} disabled={disabled} />
								</Field>
							)}
						/>

						{/* Tags */}
						<Controller
							name="tagsText"
							control={control}
							render={({ field }) => (
								<Field>
									<FieldLabel>{t('tags')}</FieldLabel>
									<InputGroupTextarea
										{...field}
										placeholder={`${t('city')}\n${t('history')}\n${t(
											'digital'
										)}`}
										disabled={disabled}
										rows={3}
									/>
								</Field>
							)}
						/>
					</FieldGroup>
				</form>
			</CardContent>

			<CardFooter>
				{/* Actions */}
				{mode === 'read' && itemId && locale && (
					<div className="flex gap-2">
						<Link href={`/${locale}/library/update/${itemId}`}>
							<Button>
								{t('edit')} {t('library.item')}
							</Button>
						</Link>

						<Link href={`/${locale}/library/delete/${itemId}`}>
							<Button variant="destructive">
								{t('delete')} {t('library.item')}
							</Button>
						</Link>
					</div>
				)}

				{mode !== 'read' && (
					<Button
						type="submit"
						form="library-item-form"
						variant={mode === 'delete' ? 'destructive' : 'default'}
						disabled={pending || isSubmitting}
					>
						{pending
							? 'Working…'
							: mode === 'delete'
							? `${t('delete')} ${t('library.item')}`
							: mode === 'update'
							? `${t('update')} ${t('library.item')}`
							: `${t('create')} ${t('library.item')}`}
					</Button>
				)}
				{/* Submit */}
				{mode === 'delete' && (
					<p className="text-sm text-destructive ml-4">{t('deleteSub')}</p>
				)}
			</CardFooter>
		</Card>
	)
}
