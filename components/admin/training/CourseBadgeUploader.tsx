'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
	clearCourseBadge,
	setCourseBadgeIcon,
	uploadCourseBadge,
} from '@/app/actions/training'
import { CourseBadgeIcon } from '@/components/training/CourseBadgeIcon'
import {
	COURSE_BADGE_ICON_GROUPS,
	DEFAULT_COURSE_BADGE_ICON,
	isCourseBadgeIconName,
} from '@/lib/training/course-badge'
import { getCourseBadgeUrlFromPath } from '@/lib/storage/courseBadges.client'

type Props = {
	courseId: string
	initialIconName?: string | null
	initialPath?: string | null
}

export function CourseBadgeUploader({
	courseId,
	initialIconName,
	initialPath,
}: Props) {
	const router = useRouter()
	const inputRef = useRef<HTMLInputElement | null>(null)
	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	const [iconName, setIconName] = useState<string>(
		initialIconName && isCourseBadgeIconName(initialIconName)
			? initialIconName
			: DEFAULT_COURSE_BADGE_ICON
	)
	const [activeIconName, setActiveIconName] = useState<string | null>(
		initialIconName ?? null
	)
	const [activeSvgPath, setActiveSvgPath] = useState<string | null>(
		initialPath ?? null
	)
	const [uploadedSvgPreviewUrl, setUploadedSvgPreviewUrl] = useState<
		string | null
	>(null)
	const [isPending, startTransition] = useTransition()
	const [source, setSource] = useState<'icon' | 'svg'>(
		initialIconName ? 'icon' : 'svg'
	)

	const currentSvgUrl = uploadedSvgPreviewUrl
		? uploadedSvgPreviewUrl
		: getCourseBadgeUrlFromPath(activeSvgPath)
	const previewIconName = source === 'icon' ? iconName : activeIconName
	const previewSvgUrl = source === 'svg' ? currentSvgUrl : null

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-3">
				<Button
					type="button"
					variant={source === 'icon' ? 'default' : 'outline'}
					onClick={() => setSource('icon')}
				>
					Lucide icon
				</Button>
				<Button
					type="button"
					variant={source === 'svg' ? 'default' : 'outline'}
					onClick={() => setSource('svg')}
				>
					Custom SVG
				</Button>
			</div>

			<div className="flex items-start gap-4">
				<div className="space-y-2">
					<CourseBadgeIcon
						iconName={previewIconName}
						svgUrl={previewSvgUrl}
						label="Course badge preview"
					/>
					<div className="text-xs text-muted-foreground text-center">
						Preview
					</div>
				</div>

				<div className="space-y-2 flex-1">
					{source === 'icon' ? (
						<>
							<div className="space-y-3 max-h-80 overflow-auto rounded-md border p-3">
								{COURSE_BADGE_ICON_GROUPS.map((group) => (
									<div key={group.key} className="space-y-2">
										<div className="text-xs font-medium text-muted-foreground">
											{group.label}
										</div>
										<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
											{group.icons.map((option) => (
												<button
													key={`${group.key}-${option.value}`}
													type="button"
													onClick={() => setIconName(option.value)}
													className={`flex flex-col items-center gap-1 rounded-md border p-2 text-center transition-colors ${
														iconName === option.value
															? 'border-primary bg-accent'
															: 'hover:bg-muted'
													}`}
												>
													<CourseBadgeIcon
														iconName={option.value}
														size="sm"
													/>
													<span className="text-[11px] leading-tight">
														{option.label}
													</span>
													<span className="text-[10px] text-muted-foreground leading-tight">
														{option.value}
													</span>
												</button>
											))}
										</div>
									</div>
								))}
							</div>

							<Button
								type="button"
								disabled={isPending}
								onClick={() => {
									startTransition(async () => {
										await setCourseBadgeIcon(courseId, iconName)
										setActiveIconName(iconName)
										setActiveSvgPath(null)
										setUploadedSvgPreviewUrl(null)
										router.refresh()
									})
								}}
							>
								{isPending ? 'Saving…' : 'Save icon'}
							</Button>
						</>
					) : (
						<>
							<input
								ref={inputRef}
								type="file"
								accept=".svg,image/svg+xml"
								onChange={(e) => {
									const file = e.target.files?.[0] ?? null
									setSelectedFile(file)
									setUploadedSvgPreviewUrl(file ? URL.createObjectURL(file) : null)
								}}
							/>

							<Button
								type="button"
								disabled={isPending || !selectedFile}
								onClick={() => {
									if (!selectedFile) return

									const fd = new FormData()
									fd.append('file', selectedFile)

									startTransition(async () => {
										const result = await uploadCourseBadge(courseId, fd)
										setActiveSvgPath(result.badgeImagePath)
										setActiveIconName(null)
										setUploadedSvgPreviewUrl(null)
										setSelectedFile(null)
										if (inputRef.current) inputRef.current.value = ''
										router.refresh()
									})
								}}
							>
								{isPending ? 'Uploading…' : 'Upload SVG'}
							</Button>
						</>
					)}
				</div>
			</div>

			<div className="flex items-center gap-2">
				<Button
					type="button"
					variant="outline"
					disabled={isPending}
					onClick={() => {
						startTransition(async () => {
							await clearCourseBadge(courseId)
							setActiveIconName(null)
							setActiveSvgPath(null)
							setUploadedSvgPreviewUrl(null)
							setSelectedFile(null)
							router.refresh()
						})
					}}
				>
					Clear badge
				</Button>
				<p className="text-xs text-muted-foreground">
					Display is always a rounded green square with white icon artwork.
				</p>
			</div>
		</div>
	)
}
