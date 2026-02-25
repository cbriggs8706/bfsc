'use client'

import {
	createLessonBlock,
	deleteLessonBlock,
	updateLessonBlock,
} from '@/app/actions/training'
import { Button } from '@/components/ui/button'
import { AnyLessonBlock } from '@/types/training'
import { TextBlockEditor } from './TextBlockEditor'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Props = {
	lessonId: string
	blocks: AnyLessonBlock[]
}

export function LessonBlocksEditor({ lessonId, blocks }: Props) {
	const router = useRouter()
	const [workingId, setWorkingId] = useState<string | null>(null)

	const textBlock = blocks.find((block) => block.type === 'text')
	const legacyBlocks = blocks.filter((block) => block.type !== 'text')

	const appendHtmlToContent = async (html: string) => {
		setWorkingId('migrate')
		try {
			let targetBlockId = textBlock?.id
			const currentBody = textBlock?.data.bodyMarkdown ?? ''

			if (!targetBlockId) {
				const created = await createLessonBlock({
					lessonId,
					type: 'text',
					data: { bodyMarkdown: '' },
				})
				targetBlockId = created.id
			}

			const nextBody = currentBody.trim()
				? `${currentBody}\n\n${html}`
				: html

			await updateLessonBlock(targetBlockId, {
				data: { bodyMarkdown: nextBody },
			})
		} finally {
			setWorkingId(null)
			router.refresh()
		}
	}

	return (
		<div className="space-y-3">
			{textBlock ? (
				<div className="border rounded p-2 space-y-2">
					<div className="flex justify-between items-center">
						<span className="text-xs text-muted-foreground">CONTENT</span>

						<Button
							size="sm"
							variant="destructive"
							onClick={async () => {
								await deleteLessonBlock(textBlock.id)
								router.refresh()
							}}
						>
							Delete
						</Button>
					</div>
					<TextBlockEditor block={textBlock} />
				</div>
			) : (
				<Button
					size="sm"
						onClick={async () => {
							await createLessonBlock({
								lessonId,
								type: 'text',
								data: { bodyMarkdown: '' },
							})
						router.refresh()
					}}
				>
					Add Content Block
				</Button>
			)}

			{legacyBlocks.map((block) => (
				<div key={block.id} className="border rounded p-2 space-y-2">
					<div className="flex justify-between items-center">
						<span className="text-xs text-muted-foreground">
							Legacy {block.type.toUpperCase()}
						</span>
						<div className="flex gap-2">
							<Button
								size="sm"
								variant="destructive"
								onClick={async () => {
									await deleteLessonBlock(block.id)
									router.refresh()
								}}
							>
								Delete
							</Button>
						</div>
					</div>
					{block.type === 'link' && (
						<div className="space-y-2">
							<input
								readOnly
								value={block.data.url}
								className="w-full rounded border bg-muted/20 px-2 py-1 text-sm"
							/>
							<div className="flex flex-wrap gap-2">
								<Button
									size="sm"
									variant="outline"
									onClick={async () => {
										await navigator.clipboard.writeText(block.data.url)
									}}
								>
									Copy URL
								</Button>
								<Button
									size="sm"
									variant="outline"
									disabled={workingId === 'migrate'}
									onClick={async () => {
										const href = escapeHtml(block.data.url)
										const label = escapeHtml(block.data.label ?? block.data.url)
										await appendHtmlToContent(
											`<p><a href="${href}" target="_blank" rel="noreferrer">${label}</a></p>`
										)
									}}
								>
									Insert Into Content
								</Button>
							</div>
						</div>
					)}
					{block.type === 'image' && (
						<div className="space-y-2">
							<input
								readOnly
								value={block.data.path}
								className="w-full rounded border bg-muted/20 px-2 py-1 text-sm"
							/>
							<div className="flex flex-wrap gap-2">
								<Button
									size="sm"
									variant="outline"
									onClick={async () => {
										await navigator.clipboard.writeText(block.data.path)
									}}
								>
									Copy Path/URL
								</Button>
								<Button
									size="sm"
									variant="outline"
									disabled={workingId === 'migrate'}
									onClick={async () => {
										const src = resolveImageUrl(block.data.path)
										await appendHtmlToContent(
											buildImageHtml(src, block.data.alt, block.data.caption)
										)
									}}
								>
									Insert Image Into Content
								</Button>
							</div>
							{!isAbsoluteUrl(block.data.path) && (
								<p className="text-xs text-muted-foreground">
									Path detected. Insert uses a public URL under
									`training-content`.
								</p>
							)}
						</div>
					)}
				</div>
			))}
		</div>
	)
}

function isAbsoluteUrl(value: string): boolean {
	return /^https?:\/\//i.test(value)
}

function resolveImageUrl(pathOrUrl: string): string {
	if (isAbsoluteUrl(pathOrUrl)) return pathOrUrl
	const base = process.env.NEXT_PUBLIC_SUPABASE_URL
	if (!base) return pathOrUrl
	const normalized = pathOrUrl.replace(/^\/+/, '')
	return `${base}/storage/v1/object/public/training-content/${normalized}`
}

function buildImageHtml(src: string, alt?: string, caption?: string): string {
	const safeSrc = escapeHtml(src)
	const safeAlt = escapeHtml(alt ?? '')
	const safeCaption = caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ''
	return `<figure><img src="${safeSrc}" alt="${safeAlt}" />${safeCaption}</figure>`
}

function escapeHtml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;')
}
