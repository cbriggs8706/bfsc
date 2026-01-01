'use client'

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { uploadProfileImage } from '@/utils/upload-profile-image'
import { updateKioskProfile } from '@/app/actions/update-kiosk-profile'
import { toast } from 'sonner'

interface Props {
	open: boolean
	onOpenChange: (open: boolean) => void
	kioskPersonId: string
	onSaved: () => void
}

export function AvatarDialog({
	open,
	onOpenChange,
	kioskPersonId,
	onSaved,
}: Props) {
	const t = useTranslations('auth.avatar')
	const [file, setFile] = useState<File | null>(null)
	const [preview, setPreview] = useState<string | null>(null)
	const [isPending, startTransition] = useTransition()

	const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selected = e.target.files?.[0]
		if (!selected) return

		setFile(selected)
		setPreview(URL.createObjectURL(selected))
	}

	const onSave = () => {
		if (!file) return

		startTransition(async () => {
			try {
				const imageUrl = await uploadProfileImage(file)

				await updateKioskProfile({
					kioskPersonId,
					profileImageUrl: imageUrl,
				})

				toast.success(t('updated'))
				onSaved()
				setFile(null)
				setPreview(null)
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

				<div className="space-y-4">
					{preview && (
						<Image
							src={preview}
							alt="Preview"
							width={120}
							height={120}
							className="rounded-full border mx-auto object-cover"
						/>
					)}

					<input
						type="file"
						accept="image/*"
						onChange={onSelectFile}
						className="block w-full text-sm text-muted-foreground
							file:mr-4 file:py-2 file:px-4
							file:rounded-md file:border
							file:bg-secondary file:text-secondary-foreground
							cursor-pointer"
					/>

					<div className="flex gap-2 pt-2">
						<Button onClick={onSave} disabled={!file || isPending}>
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
				</div>
			</DialogContent>
		</Dialog>
	)
}
