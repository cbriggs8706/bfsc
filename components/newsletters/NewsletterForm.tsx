// components/newsletters/NewsletterForm.tsx
'use client'

import { useState } from 'react'
import { Editor } from '@tinymce/tinymce-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
	NEWSLETTER_LOCALES,
	NewsletterFormData,
	NewsletterFormMode,
} from '@/types/newsletters'
import Image from 'next/image'
import { uploadNewsletterImage } from '@/utils/upload-newsletter-image'
import { Textarea } from '../ui/textarea'

type Props = {
	mode: NewsletterFormMode
	value: NewsletterFormData
	locale: string
	action?: (formData: FormData) => Promise<void>
	allowPublish?: boolean
}

function slugify(value: string): string {
	return value
		.toLowerCase()
		.trim()
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 120)
}

export function NewsletterForm({
	mode,
	value,
	locale,
	action,
	allowPublish = true,
}: Props) {
	const isReadOnly = mode === 'read'
	const [form, setForm] = useState<NewsletterFormData>(value)
	const [uploading, setUploading] = useState(false)
	const [uploadError, setUploadError] = useState<string | null>(null)
	const derivedSlug =
		slugify(form.translations.en.title) || slugify(form.slug) || 'newsletter'

	return (
		<form action={action} className="space-y-6">
			{/* Hidden fields */}
			<input type="hidden" name="id" value={form.id ?? ''} />
			<input type="hidden" name="slug" value={derivedSlug} />
			<input type="hidden" name="locale" value={locale} />
			<input
				type="hidden"
				name="coverImageUrl"
				value={form.coverImageUrl ?? ''}
			/>

			{NEWSLETTER_LOCALES.map((l) => (
				<div key={l}>
					<input
						type="hidden"
						name={`translations.${l}.title`}
						value={form.translations[l].title}
					/>
					<input
						type="hidden"
						name={`translations.${l}.excerpt`}
						value={form.translations[l].excerpt ?? ''}
					/>
					<input
						type="hidden"
						name={`translations.${l}.content`}
						value={form.translations[l].content}
					/>
				</div>
			))}

			{/* Status */}
			<div className="text-sm text-muted-foreground">
				Status:{' '}
				<span className="font-medium">
					{form.status === 'published' ? 'Published' : 'Draft'}
				</span>
				{form.status === 'published' && form.publishedAt && (
					<> — {form.publishedAt.toLocaleDateString()}</>
				)}
			</div>

			{/* Cover image */}
			{!isReadOnly && (
				<div className="space-y-2">
					<label className="text-sm font-medium">Cover image</label>

					<input
						type="file"
						accept="image/*"
						disabled={uploading}
						onChange={async (e) => {
							const file = e.target.files?.[0]
							if (!file) return

							setUploading(true)
							setUploadError(null)

							try {
								const url = await uploadNewsletterImage(file, 'cover')
								setForm((f) => ({ ...f, coverImageUrl: url }))
							} catch (err) {
								setUploadError('Failed to upload image')
								console.error(err)
							} finally {
								setUploading(false)
							}
						}}
						className="block text-sm"
					/>

					{form.coverImageUrl && (
						<div className="space-y-2">
							<div className="relative w-full max-w-md aspect-video border rounded overflow-hidden">
								<Image
									src={form.coverImageUrl}
									alt="Cover preview"
									fill
									className="object-cover"
									sizes="(max-width: 768px) 100vw, 640px"
								/>
							</div>
							<Button
								type="button"
								variant="outline"
								onClick={() =>
									setForm((f) => ({
										...f,
										coverImageUrl: null,
									}))
								}
							>
								Remove cover image
							</Button>
						</div>
					)}

					{uploading && (
						<p className="text-sm text-muted-foreground">Uploading…</p>
					)}
					{uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
				</div>
			)}

			{/* Slug */}
			<Input value={derivedSlug} disabled placeholder="slug (auto-generated)" />

			{/* Translations */}
			<Tabs defaultValue="en">
				<TabsList>
					{NEWSLETTER_LOCALES.map((l) => (
						<TabsTrigger key={l} value={l}>
							{l.toUpperCase()}
						</TabsTrigger>
					))}
				</TabsList>

				{NEWSLETTER_LOCALES.map((l) => (
					<TabsContent key={l} value={l} className="space-y-4">
						<Input
							value={form.translations[l].title}
							disabled={isReadOnly}
							placeholder={`Title (${l})`}
							onChange={(e) =>
								setForm({
									...form,
									translations: {
										...form.translations,
										[l]: { ...form.translations[l], title: e.target.value },
									},
								})
							}
						/>

						{/* <Editor
							apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
							value={form.translations[l].content}
							disabled={isReadOnly}
							onEditorChange={(content) =>
								setForm({
									...form,
									translations: {
										...form.translations,
										[l]: { ...form.translations[l], content },
									},
								})
							}
						/> */}
						<Editor
							apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
							value={form.translations[l].content}
							disabled={isReadOnly}
							onEditorChange={(content) =>
								setForm({
									...form,
									translations: {
										...form.translations,
										[l]: { ...form.translations[l], content },
									},
								})
							}
							init={{
								height: 500,
								menubar: false,
								forced_root_block: 'p',
								inline_styles: false,
								block_formats:
									'Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3; Heading 4=h4; Heading 5=h5; Heading 6=h6',
								plugins: ['lists', 'link', 'image', 'code', 'blockquote', 'paste'],
								toolbar:
									'undo redo | blocks | bold italic underline | alignleft aligncenter alignright | bullist numlist | blockquote | link image | code',
								automatic_uploads: true,
								images_file_types: 'jpg,jpeg,png,gif,webp',
								images_upload_handler: async (blobInfo) => {
									const blob = blobInfo.blob()
									const file = new File(
										[blob],
										blobInfo.filename() || 'newsletter-image.png',
										{ type: blob.type || 'image/png' }
									)
									return uploadNewsletterImage(file, 'content')
								},
							}}
						/>
						<Textarea
							name={`translations.${l}.excerpt`}
							value={form.translations[l].excerpt}
							disabled={isReadOnly}
							placeholder={`Excerpt (${l})`}
							onChange={(e) =>
								setForm({
									...form,
									translations: {
										...form.translations,
										[l]: {
											...form.translations[l],
											excerpt: e.target.value,
										},
									},
								})
							}
						/>
					</TabsContent>
				))}
			</Tabs>

			{/* Publish date */}
			{!isReadOnly && (
				<div className="space-y-2">
					<label className="text-sm font-medium">Publish date</label>
					<input
						type="date"
						name="publishedAt"
						value={
							form.publishedAt
								? form.publishedAt.toISOString().slice(0, 10)
								: ''
						}
						onChange={(e) =>
							setForm({
								...form,
								publishedAt: e.target.value ? new Date(e.target.value) : null,
							})
						}
						className="border rounded px-3 py-2"
					/>
				</div>
			)}

			{/* Buttons */}
			{mode !== 'read' && (
				<div className="flex gap-3">
					{mode !== 'delete' && (
						<>
							<Button
								type="submit"
								variant="outline"
								formAction={
									action &&
									((fd: FormData) => {
										fd.set('intent', 'draft')
										return action(fd)
									})
								}
							>
								Save Draft
							</Button>

							{allowPublish ? (
								<Button
									type="submit"
									formAction={
										action &&
										((fd: FormData) => {
											fd.set('intent', 'publish')
											if (!fd.get('publishedAt')) {
												fd.set('publishedAt', new Date().toISOString())
											}
											return action(fd)
										})
									}
								>
									Publish
								</Button>
							) : null}
						</>
					)}

					{mode === 'delete' && (
						<Button type="submit" variant="destructive">
							Delete
						</Button>
					)}
				</div>
			)}
		</form>
	)
}
