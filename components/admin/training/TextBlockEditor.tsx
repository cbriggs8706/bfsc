'use client'

import { useState } from 'react'
import { Editor } from '@tinymce/tinymce-react'
import { updateLessonBlock } from '@/app/actions/training'
import { LessonBlock } from '@/types/training'
import { uploadTrainingImage } from '@/utils/upload-training-image'

type Props = {
	block: LessonBlock<'text'>
}

export function TextBlockEditor({ block }: Props) {
	const [value, setValue] = useState(block.data.bodyMarkdown)

	return (
		<Editor
			apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
			value={value}
			onEditorChange={(content) => setValue(content)}
			onBlur={async () => {
				await updateLessonBlock(block.id, {
					data: { bodyMarkdown: value },
				})
			}}
			init={{
				height: 420,
				menubar: false,
				forced_root_block: 'p',
				inline_styles: false,
				block_formats:
					'Paragraph=p; Heading 2=h2; Heading 3=h3; Heading 4=h4',
				plugins: ['lists', 'link', 'image', 'code', 'blockquote', 'paste'],
				toolbar:
					'undo redo | blocks | bold italic underline | alignleft aligncenter alignright | bullist numlist | blockquote | link image | code',
				automatic_uploads: true,
				images_file_types: 'jpg,jpeg,png,gif,webp',
				images_upload_handler: async (blobInfo) => {
					const blob = blobInfo.blob()
					const file = new File(
						[blob],
						blobInfo.filename() || 'training-image.png',
						{ type: blob.type || 'image/png' }
					)
					return uploadTrainingImage(file)
				},
			}}
		/>
	)
}
