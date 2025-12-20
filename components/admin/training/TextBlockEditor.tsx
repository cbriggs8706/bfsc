'use client'

import { updateLessonBlock } from '@/app/actions/training'
import { Textarea } from '@/components/ui/textarea'
import { LessonBlock } from '@/types/training'

type Props = {
	block: LessonBlock<'text'>
}

export function TextBlockEditor({ block }: Props) {
	return (
		<Textarea
			defaultValue={block.data.bodyMarkdown}
			onBlur={(e) =>
				updateLessonBlock(block.id, {
					data: { bodyMarkdown: e.target.value },
				})
			}
		/>
	)
}
