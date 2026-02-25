'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import Cropper, { type Area } from 'react-easy-crop'

import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'

import { upsertCenterProfile } from '@/lib/actions/center/center'
import { normalizePhoneToE164, toCountryCode } from '@/utils/phone'
import { uploadCenterHeroImage } from '@/utils/upload-center-hero-image'

const HERO_ASPECT_RATIO = 16 / 9
const HERO_EXPORT_WIDTH = 1920
const HERO_EXPORT_HEIGHT = 1080

async function buildCroppedHeroFile(
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
	canvas.width = HERO_EXPORT_WIDTH
	canvas.height = HERO_EXPORT_HEIGHT

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
		HERO_EXPORT_WIDTH,
		HERO_EXPORT_HEIGHT
	)

	const blob = await new Promise<Blob | null>((resolve) =>
		canvas.toBlob(resolve, 'image/jpeg', 0.92)
	)
	if (!blob) throw new Error('Failed to export cropped image')

	return new File([blob], fileName.replace(/\.[^.]+$/, '.jpg'), {
		type: 'image/jpeg',
	})
}

const CenterProfileSchema = z.object({
	name: z.string().min(2, 'Name is required'),
	abbreviation: z
		.string()
		.regex(/^[A-Z]{4}$/, 'Abbreviation must be exactly 4 uppercase letters'),
	address: z.string().min(2, 'Address is required'),
	city: z.string().min(2, 'City is required'),
	state: z.string().regex(/^[A-Z]{2}$/, 'State must be 2 uppercase letters'),
	zipcode: z
		.string()
		.min(5, 'Zipcode is required')
		.max(10, 'Zipcode is too long'),
	phoneCountry: z
		.string()
		.regex(/^[A-Z]{2}$/)
		.default('US'),
	phoneNumber: z.string().min(4, 'Phone number is required').max(40),

	// ✅ REQUIRED string, with default provided via useForm defaultValues
	primaryLanguage: z.string().min(2).default('en'),

	heroImageUrl: z.string().url('Must be a valid image URL').nullable(),

	// ✅ allow empty input => null
	established: z
		.preprocess((v) => {
			// react-hook-form gives "" for empty <input type="number" />
			if (v === '' || v === undefined || v === null) return null
			const n = Number(v)
			return Number.isFinite(n) ? n : null
		}, z.number().int().min(1700).max(2100).nullable())
		.optional()
		.transform((v) => v ?? null),
})

export type CenterProfileFormValues = z.input<typeof CenterProfileSchema>
export type CenterProfilePayload = z.output<typeof CenterProfileSchema>

type Props = {
	initialCenter: {
		name: string
		abbreviation: string
		address: string
		city: string
		state: string
		zipcode: string
		phoneNumber: string
		phoneCountry: string
		primaryLanguage: string
		heroImageUrl: string | null
		established: number | null
	}
}

export function CenterProfileForm({ initialCenter }: Props) {
	const [isPending, startTransition] = useTransition()
	const [uploadingHeroImage, setUploadingHeroImage] = useState(false)
	const [cropDialogOpen, setCropDialogOpen] = useState(false)
	const [cropSourceImage, setCropSourceImage] = useState<string | null>(null)
	const [cropSourceName, setCropSourceName] = useState<string>('hero.jpg')
	const [crop, setCrop] = useState({ x: 0, y: 0 })
	const [zoom, setZoom] = useState(1)
	const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

	const defaultValues = useMemo<CenterProfileFormValues>(
		() => ({
			name: initialCenter.name ?? '',
			abbreviation: (initialCenter.abbreviation ?? '').toUpperCase(),
			address: initialCenter.address ?? '',
			city: initialCenter.city ?? '',
			state: (initialCenter.state ?? '').toUpperCase(),
			zipcode: initialCenter.zipcode ?? '',
			phoneNumber: initialCenter.phoneNumber ?? '',
			phoneCountry: (initialCenter.phoneCountry ?? 'US').toUpperCase(),
			primaryLanguage: initialCenter.primaryLanguage ?? 'en',
			heroImageUrl: initialCenter.heroImageUrl ?? null,
			established: initialCenter.established ?? null,
		}),
		[initialCenter]
	)

	const form = useForm<CenterProfileFormValues>({
		resolver: zodResolver(CenterProfileSchema),
		defaultValues,
		mode: 'onBlur',
	})

	// If parent passes new initialCenter, keep form in sync
	useEffect(() => {
		form.reset(defaultValues)
	}, [defaultValues, form])

	const onSubmit = (values: CenterProfileFormValues) => {
		startTransition(async () => {
			try {
				const parsed = CenterProfileSchema.parse(values) // CenterProfilePayload
				const phoneCountry = toCountryCode(parsed.phoneCountry, 'US')

				const e164 = normalizePhoneToE164(parsed.phoneNumber, phoneCountry)
				if (!e164) {
					toast.error('Phone number is not valid for the selected country')
					return
				}
				const payload = {
					...parsed,
					phoneNumber: e164, //
					phoneCountry,
					abbreviation: parsed.abbreviation.toUpperCase().slice(0, 4),
					state: parsed.state.toUpperCase().slice(0, 2),
					primaryLanguage: parsed.primaryLanguage || 'en',
				}

				const res = await upsertCenterProfile(payload)

				if (!res?.ok) {
					toast.error(res?.message ?? 'Failed to save center profile')
					return
				}

				toast.success('Center profile saved')
			} catch (err) {
				console.error(err)
				toast.error('Something went wrong saving the center profile')
			}
		})
	}

	const {
		register,
		handleSubmit,
		setValue,
		formState: { errors },
		control,
	} = form

	const primaryLanguage =
		useWatch({
			control,
			name: 'primaryLanguage',
		}) ?? 'en'

	const heroImageUrl = useWatch({
		control,
		name: 'heroImageUrl',
	})

	const handleHeroImageUpload = async (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = e.target.files?.[0]
		if (!file) return

		if (cropSourceImage?.startsWith('blob:')) {
			URL.revokeObjectURL(cropSourceImage)
		}

		setCrop({ x: 0, y: 0 })
		setZoom(1)
		setCroppedAreaPixels(null)
		setCropSourceName(file.name)
		setCropSourceImage(URL.createObjectURL(file))
		setCropDialogOpen(true)
		e.target.value = ''
	}

	const uploadCroppedHeroImage = async () => {
		if (!cropSourceImage || !croppedAreaPixels) {
			toast.error('Select a crop area first')
			return
		}

		setUploadingHeroImage(true)
		try {
			const croppedFile = await buildCroppedHeroFile(
				cropSourceImage,
				croppedAreaPixels,
				cropSourceName
			)
			const url = await uploadCenterHeroImage(croppedFile)
			setValue('heroImageUrl', url, { shouldDirty: true, shouldValidate: true })
			toast.success('Hero image uploaded')
			setCropDialogOpen(false)
			if (cropSourceImage.startsWith('blob:')) {
				URL.revokeObjectURL(cropSourceImage)
			}
			setCropSourceImage(null)
		} catch (err) {
			console.error(err)
			toast.error('Hero image upload failed')
		} finally {
			setUploadingHeroImage(false)
		}
	}

	useEffect(() => {
		return () => {
			if (cropSourceImage?.startsWith('blob:')) {
				URL.revokeObjectURL(cropSourceImage)
			}
		}
	}, [cropSourceImage])

	return (
		<Card>
			<form onSubmit={handleSubmit(onSubmit)}>
				<CardContent className="p-4 space-y-4">
					<div>
						<div className="text-lg font-semibold">Center Profile</div>
						<div className="text-sm text-muted-foreground">
							These settings apply to the site as a whole.
						</div>
					</div>

					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-1">
							<label className="text-sm font-medium">Name</label>
							<Input
								{...register('name')}
								placeholder="Burley FamilySearch Center"
							/>
							{errors.name && (
								<p className="text-xs text-destructive">
									{errors.name.message}
								</p>
							)}
						</div>

						<div className="space-y-1">
							<label className="text-sm font-medium">Abbreviation</label>
							<Input
								{...register('abbreviation')}
								placeholder="BFSC"
								maxLength={4}
								onChange={(e) => {
									const v = e.target.value.toUpperCase().replace(/[^A-Z]/g, '')
									setValue('abbreviation', v.slice(0, 4), {
										shouldValidate: true,
									})
								}}
							/>
							{errors.abbreviation && (
								<p className="text-xs text-destructive">
									{errors.abbreviation.message}
								</p>
							)}
						</div>

						<div className="space-y-1 md:col-span-2">
							<label className="text-sm font-medium">Address</label>
							<Input {...register('address')} placeholder="123 Main St" />
							{errors.address && (
								<p className="text-xs text-destructive">
									{errors.address.message}
								</p>
							)}
						</div>

						<div className="space-y-1">
							<label className="text-sm font-medium">City</label>
							<Input {...register('city')} placeholder="Burley" />
							{errors.city && (
								<p className="text-xs text-destructive">
									{errors.city.message}
								</p>
							)}
						</div>

						<div className="space-y-1">
							<label className="text-sm font-medium">State</label>
							<Input
								{...register('state')}
								placeholder="ID"
								maxLength={2}
								onChange={(e) => {
									const v = e.target.value.toUpperCase().replace(/[^A-Z]/g, '')
									setValue('state', v.slice(0, 2), { shouldValidate: true })
								}}
							/>
							{errors.state && (
								<p className="text-xs text-destructive">
									{errors.state.message}
								</p>
							)}
						</div>

						<div className="space-y-1">
							<label className="text-sm font-medium">Zipcode</label>
							<Input {...register('zipcode')} placeholder="83318" />
							{errors.zipcode && (
								<p className="text-xs text-destructive">
									{errors.zipcode.message}
								</p>
							)}
						</div>

						<div className="space-y-2 md:col-span-2">
							<label className="text-sm font-medium">
								Homepage Hero Image
							</label>
							<Input
								type="file"
								accept="image/*"
								disabled={uploadingHeroImage}
								onChange={handleHeroImageUpload}
							/>
							<p className="text-xs text-muted-foreground">
								Uploaded to Supabase bucket <code>center</code>.
							</p>
							{heroImageUrl ? (
								<div className="space-y-2">
									<div className="relative w-full max-w-xl aspect-video overflow-hidden rounded-md border">
										<Image
											src={heroImageUrl}
											alt="Homepage hero preview"
											fill
											className="object-cover"
										/>
									</div>
									<Button
										type="button"
										variant="secondary"
										size="sm"
										onClick={() =>
											setValue('heroImageUrl', null, {
												shouldDirty: true,
												shouldValidate: true,
											})
										}
									>
										Use default hero image
									</Button>
								</div>
							) : (
								<p className="text-sm text-muted-foreground">
									Using the default built-in hero image.
								</p>
							)}
							{errors.heroImageUrl && (
								<p className="text-xs text-destructive">
									{errors.heroImageUrl.message}
								</p>
							)}
						</div>

						<div className="grid gap-4 md:grid-cols-3">
							<div className="space-y-1">
								<label className="text-sm font-medium">Country</label>
								<Input
									{...register('phoneCountry')}
									placeholder="US"
									maxLength={2}
									onChange={(e) => {
										const v = e.target.value
											.toUpperCase()
											.replace(/[^A-Z]/g, '')
										setValue('phoneCountry', v.slice(0, 2), {
											shouldValidate: true,
										})
									}}
								/>
							</div>

							<div className="space-y-1 md:col-span-2">
								<label className="text-sm font-medium">Phone Number</label>
								<Input
									{...register('phoneNumber')}
									placeholder="+1 208 555 1234"
								/>
							</div>
						</div>

						<div className="space-y-1">
							<label className="text-sm font-medium">Primary Language</label>
							<Select
								value={primaryLanguage}
								onValueChange={(v) =>
									setValue('primaryLanguage', v, { shouldValidate: true })
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select language" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="en">English (en)</SelectItem>
									<SelectItem value="es">Spanish (es)</SelectItem>
									<SelectItem value="pt">Portuguese (pt)</SelectItem>
								</SelectContent>
							</Select>
							{errors.primaryLanguage && (
								<p className="text-xs text-destructive">
									{errors.primaryLanguage.message}
								</p>
							)}
						</div>

						<div className="space-y-1">
							<label className="text-sm font-medium">
								Established (optional)
							</label>
							<Input
								type="number"
								{...register('established')}
								placeholder="1998"
								inputMode="numeric"
							/>
							{errors.established && (
								<p className="text-xs text-destructive">
									{errors.established.message as string}
								</p>
							)}
						</div>
					</div>
				</CardContent>

				<CardFooter className="p-4 pt-0 flex justify-end">
					<Button type="submit" disabled={isPending || uploadingHeroImage}>
						{isPending ? 'Saving…' : 'Save'}
					</Button>
				</CardFooter>
			</form>

			<Dialog
				open={cropDialogOpen}
				onOpenChange={(open) => {
					if (uploadingHeroImage) return
					setCropDialogOpen(open)
					if (!open && cropSourceImage?.startsWith('blob:')) {
						URL.revokeObjectURL(cropSourceImage)
						setCropSourceImage(null)
					}
				}}
			>
				<DialogContent className="max-w-3xl" showCloseButton={!uploadingHeroImage}>
					<DialogHeader>
						<DialogTitle>Crop Hero Image</DialogTitle>
						<DialogDescription>
							Choose the framing for the homepage hero image (16:9).
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-3">
						<div className="relative h-[45vh] min-h-[280px] w-full overflow-hidden rounded-md border">
							{cropSourceImage ? (
								<Cropper
									image={cropSourceImage}
									crop={crop}
									zoom={zoom}
									aspect={HERO_ASPECT_RATIO}
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
								disabled={uploadingHeroImage}
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="secondary"
							disabled={uploadingHeroImage}
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
							disabled={uploadingHeroImage || !croppedAreaPixels}
							onClick={uploadCroppedHeroImage}
						>
							{uploadingHeroImage ? 'Uploading…' : 'Crop and Upload'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Card>
	)
}
