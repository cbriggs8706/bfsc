'use client'

import { updateLessonBlock } from '@/app/actions/training'
import { Input } from '@/components/ui/input'
import { LessonBlock } from '@/types/training'

type Props = {
	block: LessonBlock<'image'>
}

export function ImageBlockEditor({ block }: Props) {
	return (
		<Input
			defaultValue={block.data.path}
			placeholder="Supabase image path"
			onBlur={(e) =>
				updateLessonBlock(block.id, {
					data: {
						...block.data,
						path: e.target.value,
					},
				})
			}
		/>
	)
}
