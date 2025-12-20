'use client'

import { createLessonBlock, deleteLessonBlock } from '@/app/actions/training'
import { Button } from '@/components/ui/button'
import {
	AnyLessonBlock,
	CreateLessonBlockDraft,
	LessonBlockTypeMap,
} from '@/types/training'
import { TextBlockEditor } from './TextBlockEditor'
import { ImageBlockEditor } from './ImageBlockEditor'
import { LinkBlockEditor } from './LinkBlockEditor'
import { useRouter } from 'next/navigation'

type Props = {
	lessonId: string
	blocks: AnyLessonBlock[]
}

export function LessonBlocksEditor({ lessonId, blocks }: Props) {
	const router = useRouter()

	const create = async <T extends keyof LessonBlockTypeMap>(
		draft: CreateLessonBlockDraft<T>
	) => {
		await createLessonBlock({
			lessonId,
			type: draft.type,
			sortOrder: draft.sortOrder,
			data: draft.data,
		})

		router.refresh()
	}

	return (
		<div className="space-y-3">
			<div className="flex gap-2">
				<Button
					size="sm"
					onClick={() =>
						create({
							type: 'text',
							data: { bodyMarkdown: '' },
						})
					}
				>
					+ Text
				</Button>

				<Button
					size="sm"
					onClick={() =>
						create({
							type: 'image',
							data: { path: '' },
						})
					}
				>
					+ Image
				</Button>

				<Button
					size="sm"
					onClick={() =>
						create({
							type: 'link',
							data: { url: '' },
						})
					}
				>
					+ Link
				</Button>
			</div>

			{blocks.map((block) => (
				<div key={block.id} className="border rounded p-2 space-y-2">
					<div className="flex justify-between items-center">
						<span className="text-xs text-muted-foreground">
							{block.type.toUpperCase()}
						</span>

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

					{block.type === 'text' && <TextBlockEditor block={block} />}
					{block.type === 'image' && <ImageBlockEditor block={block} />}
					{block.type === 'link' && <LinkBlockEditor block={block} />}
				</div>
			))}
		</div>
	)
}
