'use client'

import { useEffect, useState } from 'react'
import { Editor } from '@tinymce/tinymce-react'
import { updateLessonBlock } from '@/app/actions/training'
import { LessonBlock } from '@/types/training'
import { uploadTrainingImage } from '@/utils/upload-training-image'
import { Button } from '@/components/ui/button'

type Props = {
	block: LessonBlock<'text'>
}

export function TextBlockEditor({ block }: Props) {
	const [value, setValue] = useState(block.data.bodyMarkdown)
	const [savedValue, setSavedValue] = useState(block.data.bodyMarkdown)
	const [isSaving, setIsSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		setValue(block.data.bodyMarkdown)
		setSavedValue(block.data.bodyMarkdown)
		setError(null)
	}, [block.id, block.data.bodyMarkdown])

	const isDirty = value !== savedValue

	const save = async () => {
		if (!isDirty || isSaving) return
		setIsSaving(true)
		setError(null)
		try {
			await updateLessonBlock(block.id, {
				data: { bodyMarkdown: value },
			})
			setSavedValue(value)
		} catch {
			setError('Could not save changes. Try Save again.')
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<div className="space-y-2">
			<Editor
				apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
				value={value}
				onEditorChange={(content) => setValue(content)}
				onBlur={save}
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

			<div className="flex items-center justify-between">
				<p className="text-xs text-muted-foreground">
					{error ?? (isDirty ? 'Unsaved changes' : 'All changes saved')}
				</p>
				<Button
					type="button"
					size="sm"
					disabled={!isDirty || isSaving}
					onClick={save}
				>
					{isSaving ? 'Saving...' : 'Save'}
				</Button>
			</div>
		</div>
	)
}
