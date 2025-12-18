import {
	AnyLessonBlock,
	LessonBlock,
	TextBlockData,
	ImageBlockData,
	LinkBlockData,
} from '@/types/training'

type RawLessonBlockRow = {
	id: string
	lessonId: string
	type: 'text' | 'image' | 'link'
	sortOrder: number
	data: unknown
	createdAt: Date
	updatedAt: Date
}

export function mapLessonBlock(row: RawLessonBlockRow): AnyLessonBlock {
	switch (row.type) {
		case 'text':
			return {
				...row,
				type: 'text',
				data: row.data as TextBlockData,
			}

		case 'image':
			return {
				...row,
				type: 'image',
				data: row.data as ImageBlockData,
			}

		case 'link':
			return {
				...row,
				type: 'link',
				data: row.data as LinkBlockData,
			}
	}
}
