'use client'

import { updateLessonBlock } from '@/app/actions/training'
import { Input } from '@/components/ui/input'
import { LessonBlock } from '@/types/training'

type Props = {
	block: LessonBlock<'link'>
}

export function LinkBlockEditor({ block }: Props) {
	return (
		<Input
			defaultValue={block.data.url}
			placeholder="https://..."
			onBlur={(e) =>
				updateLessonBlock(block.id, {
					data: {
						...block.data,
						url: e.target.value,
					},
				})
			}
		/>
	)
}
