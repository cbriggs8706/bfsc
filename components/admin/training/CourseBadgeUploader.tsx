'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { uploadCourseBadge } from '@/app/actions/training'

type Props = {
	courseId: string
	initialUrl?: string | null
}

export function CourseBadgeUploader({ courseId, initialUrl }: Props) {
	const inputRef = useRef<HTMLInputElement | null>(null)
	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	const [previewUrl, setPreviewUrl] = useState<string | null>(
		initialUrl ?? null
	)
	const [isPending, startTransition] = useTransition()

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-4">
				{/* Preview */}
				<div className="h-16 w-16 rounded-md border overflow-hidden flex items-center justify-center bg-muted">
					{previewUrl ? (
						<Image
							src={previewUrl}
							alt="Course badge"
							width={64}
							height={64}
							className="object-cover"
						/>
					) : (
						<span className="text-xs text-muted-foreground">No badge</span>
					)}
				</div>

				<div className="space-y-2">
					<input
						ref={inputRef}
						type="file"
						accept="image/*"
						onChange={(e) => {
							const file = e.target.files?.[0] ?? null
							setSelectedFile(file)

							if (file) {
								setPreviewUrl(URL.createObjectURL(file))
							}
						}}
					/>

					<Button
						disabled={isPending || !selectedFile}
						onClick={() => {
							if (!selectedFile) return

							const fd = new FormData()
							fd.append('file', selectedFile)

							startTransition(async () => {
								await uploadCourseBadge(courseId, fd)
							})
						}}
					>
						{isPending ? 'Uploading…' : 'Upload Badge'}
					</Button>
				</div>
			</div>

			<p className="text-xs text-muted-foreground">
				Upload a square image (recommended 256×256 or 512×512).
			</p>
		</div>
	)
}
