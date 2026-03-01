'use client'

import * as React from 'react'
import { uploadResourceImage } from '@/utils/upload-resource-image'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { deleteResource, saveResource } from '@/lib/actions/resource/resource'
import type { ResourceFormValues } from '@/types/resource'

import { Card, CardContent, CardFooter } from '@/components/ui/card'
import {
	Field,
	FieldGroup,
	FieldLabel,
	FieldError,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroupTextarea } from '@/components/ui/input-group'
import { Switch } from '@/components/ui/switch'
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Required } from '@/components/Required'
import { Mode } from '@/types/crud'
import Image from 'next/image'
import Cropper, { type Area } from 'react-easy-crop'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'

const RESOURCE_IMAGE_ASPECT_RATIO = 4 / 3
const RESOURCE_EXPORT_WIDTH = 1200
const RESOURCE_EXPORT_HEIGHT = 900
const RESOURCE_MAX_BYTES = 1_500_000

function toBlob(
	canvas: HTMLCanvasElement,
	type: string,
	quality: number
): Promise<Blob | null> {
	return new Promise((resolve) => {
		canvas.toBlob(resolve, type, quality)
	})
}

async function buildCroppedResourceFile(
	imageSrc: string,
	cropArea: Area,
	fileName: string
): Promise<File> {
	const image = await new Promise<HTMLImageElement>((resolve, reject) => {
		const img = new window.Image()
		img.onload = () => resolve(img)
		img.onerror = () => reject(new Error('Unable to load selected image'))
		img.src = imageSrc
	})

	const canvas = document.createElement('canvas')
	canvas.width = RESOURCE_EXPORT_WIDTH
	canvas.height = RESOURCE_EXPORT_HEIGHT

	const ctx = canvas.getContext('2d')
	if (!ctx) throw new Error('Failed to create image canvas')

	ctx.drawImage(
		image,
		cropArea.x,
		cropArea.y,
		cropArea.width,
		cropArea.height,
		0,
		0,
		RESOURCE_EXPORT_WIDTH,
		RESOURCE_EXPORT_HEIGHT
	)

	let quality = 0.9
	let blob = await toBlob(canvas, 'image/webp', quality)

	while (blob && blob.size > RESOURCE_MAX_BYTES && quality > 0.45) {
		quality = Math.max(quality - 0.1, 0.45)
		blob = await toBlob(canvas, 'image/webp', quality)
	}

	if (!blob) throw new Error('Failed to export cropped image')

	return new File([blob], fileName.replace(/\.[^.]+$/, '.webp'), {
		type: 'image/webp',
	})
}

/* ------------------------------------------------------------------ */
/* Schema (UI validation only — strings) */
/* ------------------------------------------------------------------ */

function schema(t: (k: string) => string) {
	return z.object({
		name: z.string().min(1, t('nameRequired')),
		type: z.enum(['equipment', 'room', 'booth', 'activity']),
		defaultDurationMinutes: z.string().min(1, t('required')),
		maxConcurrent: z.string().catch(''),
		capacity: z.string().catch(''),
		isActive: z.boolean(),
		description: z.string().catch(''),
		requiredItems: z.string().catch(''),
		prep: z.string().catch(''),
		notes: z.string().catch(''),
		link: z.union([z.literal(''), z.string().url(t('invalidUrl'))]).catch(''),
		video: z.union([z.literal(''), z.string().url(t('invalidUrl'))]).catch(''),
		image: z.string().catch(''),
	})
}

/* ------------------------------------------------------------------ */
/* Props */
/* ------------------------------------------------------------------ */

type Props = {
	locale: string
	mode: Mode
	resourceId?: string
	initialValues?: Partial<ResourceFormValues>
}

/* ------------------------------------------------------------------ */
/* Component */
/* ------------------------------------------------------------------ */

export function ResourceForm({
	locale,
	mode,
	resourceId,
	initialValues,
}: Props) {
	const t = useTranslations('common')
	const router = useRouter()
	const fieldsDisabled = mode === 'read' || mode === 'delete'

	const form = useForm<ResourceFormValues>({
		resolver: zodResolver(schema(t)),
		defaultValues: {
			name: '',
			type: 'equipment',
			defaultDurationMinutes: '',
			maxConcurrent: '',
			capacity: '',
			isActive: true,
			description: '',
			requiredItems: '',
			prep: '',
			notes: '',
			link: '',
			video: '',
			image: '',
			...initialValues,
		},
	})

	const {
		control,
		handleSubmit,
		setError,
		formState: { errors, isSubmitting },
	} = form

	const type = useWatch({ control, name: 'type' })

	async function onSubmit(values: ResourceFormValues) {
		if (mode === 'delete') {
			const res = await deleteResource(resourceId!)

			if (!res.ok) {
				setError('root', { message: res.message })
				return
			}

			router.push(`/${locale}/admin/center/resources`)
			return
		}

		// create / update
		const res = await saveResource(
			mode === 'update' ? 'update' : 'create',
			resourceId ?? null,
			values
		)

		if (!res.ok) {
			setError('root', { message: res.message })
			return
		}

		router.push(`/${locale}/admin/center/resources`)
	}
	const submitDisabled = isSubmitting || mode === 'read'
	return (
		<Card className="w-full">
			<CardContent>
				<form id="resource-form" onSubmit={handleSubmit(onSubmit)}>
					<FieldGroup>
						{/* Root error */}
						{errors.root && (
							<p className="text-sm text-destructive">{errors.root.message}</p>
						)}

						{/* Name */}
						<Controller
							name="name"
							control={control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>
										<Required>{t('name')}</Required>
									</FieldLabel>
									<Input {...field} disabled={fieldsDisabled} />
									{fieldState.error && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>

						{/* Type */}
						<Controller
							name="type"
							control={control}
							render={({ field }) => (
								<Field>
									<FieldLabel>{t('resource.type')}</FieldLabel>
									<Select
										value={field.value}
										onValueChange={field.onChange}
										disabled={fieldsDisabled}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="equipment">
												{t('resource.types.equipment')}
											</SelectItem>
											<SelectItem value="room">
												{t('resource.types.room')}
											</SelectItem>
											<SelectItem value="booth">
												{t('resource.types.booth')}
											</SelectItem>
											<SelectItem value="activity">
												{t('resource.types.activity')}
											</SelectItem>
										</SelectContent>
									</Select>
								</Field>
							)}
						/>

						{/* Duration */}
						<Controller
							name="defaultDurationMinutes"
							control={control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>
										{t('resource.defaultDuration')} ({t('minutes')})
									</FieldLabel>
									<Input type="number" {...field} disabled={fieldsDisabled} />
									{fieldState.error && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>

						{/* Capacity / Max Concurrent */}
						<Controller
							name={type === 'activity' ? 'capacity' : 'maxConcurrent'}
							control={control}
							render={({ field }) => (
								<Field>
									<FieldLabel>
										{type === 'activity'
											? t('resource.capacity')
											: t('resource.maxConcurrent')}
									</FieldLabel>
									<Input type="number" {...field} disabled={fieldsDisabled} />
								</Field>
							)}
						/>

						{/* Active */}
						<Controller
							name="isActive"
							control={control}
							render={({ field }) => (
								<Field>
									<FieldLabel>{t('status')}</FieldLabel>
									<div className="flex items-center gap-2 h-10">
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
											disabled={fieldsDisabled}
										/>
										<span className="text-sm">
											{field.value ? t('active') : t('inactive')}
										</span>
									</div>
								</Field>
							)}
						/>

						{/* Text areas */}
						{(['description', 'requiredItems', 'prep', 'notes'] as const).map(
							(name) => (
								<Controller
									key={name}
									name={name}
									control={control}
									render={({ field }) => (
										<Field>
											<FieldLabel>{t(name)}</FieldLabel>
											<InputGroupTextarea
												{...field}
												rows={3}
												disabled={fieldsDisabled}
											/>
										</Field>
									)}
								/>
							)
						)}

						{/* Link */}
						<Controller
							name="link"
							control={control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>{t('link')}</FieldLabel>
									<Input {...field} disabled={fieldsDisabled} />
									{fieldState.error && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>

						{/* Image */}
						<Controller
							name="image"
							control={control}
							render={({ field }) => (
								<Field>
									<FieldLabel>{t('image')}</FieldLabel>
									<ResourceImageField
										value={field.value ?? ''}
										disabled={fieldsDisabled}
										onChange={field.onChange}
									/>
								</Field>
							)}
						/>

						{/* Video */}
						<Controller
							name="video"
							control={control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>{t('videoUrl')}</FieldLabel>
									<Input {...field} disabled={fieldsDisabled} />
									{fieldState.error && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>
					</FieldGroup>
				</form>
			</CardContent>

			<CardFooter>
				{mode !== 'read' && (
					<Button
						type="submit"
						form="resource-form"
						disabled={submitDisabled}
						variant={mode === 'delete' ? 'destructive' : 'default'}
					>
						{isSubmitting
							? t('working')
							: mode === 'delete'
							? `${t('delete')} ${t('resource.title')}`
							: mode === 'update'
							? `${t('update')} ${t('resource.title')}`
							: `${t('create')} ${t('resource.title')}`}
					</Button>
				)}
			</CardFooter>
		</Card>
	)
}

function ResourceImageField(props: {
	value: string
	disabled?: boolean
	onChange: (url: string) => void
}) {
	const { value, disabled, onChange } = props
	const fileRef = React.useRef<HTMLInputElement | null>(null)
	const [isUploading, setIsUploading] = React.useState(false)
	const [isProcessingImage, setIsProcessingImage] = React.useState(false)
	const [error, setError] = React.useState<string | null>(null)
	const [cropDialogOpen, setCropDialogOpen] = React.useState(false)
	const [cropSourceImage, setCropSourceImage] = React.useState<string | null>(null)
	const [cropSourceName, setCropSourceName] = React.useState('resource-image.jpg')
	const [crop, setCrop] = React.useState({ x: 0, y: 0 })
	const [zoom, setZoom] = React.useState(1)
	const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<Area | null>(
		null
	)

	async function handlePickFile(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0]
		if (!file) return

		setError(null)
		setCrop({ x: 0, y: 0 })
		setZoom(1)
		setCroppedAreaPixels(null)
		setCropSourceName(file.name)
		if (cropSourceImage?.startsWith('blob:')) {
			URL.revokeObjectURL(cropSourceImage)
		}
		setCropSourceImage(URL.createObjectURL(file))
		setCropDialogOpen(true)
		if (fileRef.current) fileRef.current.value = ''
	}

	async function handleCropAndUpload() {
		if (!cropSourceImage || !croppedAreaPixels) {
			setError('Select a crop area first.')
			return
		}

		setError(null)
		setIsProcessingImage(true)

		try {
			const processedFile = await buildCroppedResourceFile(
				cropSourceImage,
				croppedAreaPixels,
				cropSourceName
			)
			setIsUploading(true)
			const url = await uploadResourceImage(processedFile)
			onChange(url)
			setCropDialogOpen(false)
			if (cropSourceImage.startsWith('blob:')) {
				URL.revokeObjectURL(cropSourceImage)
			}
			setCropSourceImage(null)
		} catch (err) {
			if (err instanceof Error) {
				setError(err.message)
			} else {
				setError('Upload failed.')
			}
		} finally {
			setIsProcessingImage(false)
			setIsUploading(false)
		}
	}

	React.useEffect(() => {
		return () => {
			if (cropSourceImage?.startsWith('blob:')) {
				URL.revokeObjectURL(cropSourceImage)
			}
		}
	}, [cropSourceImage])

	const isBusy = isUploading || isProcessingImage

	return (
		<div className="space-y-2">
			<input
				ref={fileRef}
				type="file"
				accept="image/*"
				className="hidden"
				onChange={handlePickFile}
				disabled={disabled || isBusy}
			/>

			<div className="flex items-center gap-2">
				<Button
					type="button"
					variant="secondary"
					onClick={() => fileRef.current?.click()}
					disabled={disabled || isBusy}
				>
					{isUploading
						? 'Uploading…'
						: isProcessingImage
						? 'Processing…'
						: value
						? 'Replace image'
						: 'Upload image'}
				</Button>

				{value ? (
					<Button
						type="button"
						variant="ghost"
						onClick={() => onChange('')}
						disabled={disabled || isBusy}
					>
						Remove
					</Button>
				) : null}
			</div>

			{/* optional: show stored url */}
			<Input value={value ?? ''} readOnly />

			{value ? (
				<div className="rounded-md border overflow-hidden w-full max-w-[320px]">
					<div className="relative w-full max-w-[320px] aspect-video">
						<Image
							src={value}
							alt="Resource image"
							fill
							className="object-contain"
							sizes="320px"
						/>
					</div>
				</div>
			) : null}

			{error ? <p className="text-sm text-destructive">{error}</p> : null}

			<Dialog
				open={cropDialogOpen}
				onOpenChange={(open) => {
					if (isBusy) return
					setCropDialogOpen(open)
					if (!open && cropSourceImage?.startsWith('blob:')) {
						URL.revokeObjectURL(cropSourceImage)
						setCropSourceImage(null)
					}
				}}
			>
				<DialogContent className="max-w-3xl" showCloseButton={!isBusy}>
					<DialogHeader>
						<DialogTitle>Crop Resource Image</DialogTitle>
						<DialogDescription>
							Choose a 4:3 crop. The uploaded image is optimized to stay small.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-3">
						<div className="relative h-[45vh] min-h-[280px] w-full overflow-hidden rounded-md border">
							{cropSourceImage ? (
								<Cropper
									image={cropSourceImage}
									crop={crop}
									zoom={zoom}
									aspect={RESOURCE_IMAGE_ASPECT_RATIO}
									onCropChange={setCrop}
									onZoomChange={setZoom}
									onCropComplete={(_, areaPixels) =>
										setCroppedAreaPixels(areaPixels)
									}
								/>
							) : null}
						</div>
						<div className="space-y-1">
							<label className="text-sm font-medium">Zoom</label>
							<Input
								type="range"
								min={1}
								max={3}
								step={0.05}
								value={zoom}
								onChange={(e) => setZoom(Number(e.target.value))}
								disabled={isBusy}
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="secondary"
							disabled={isBusy}
							onClick={() => {
								setCropDialogOpen(false)
								if (cropSourceImage?.startsWith('blob:')) {
									URL.revokeObjectURL(cropSourceImage)
								}
								setCropSourceImage(null)
							}}
						>
							Cancel
						</Button>
						<Button
							type="button"
							disabled={isBusy || !croppedAreaPixels}
							onClick={handleCropAndUpload}
						>
							{isBusy ? 'Working…' : 'Crop and Upload'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
