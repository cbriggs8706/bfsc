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

type Props = {
	mode: NewsletterFormMode
	value: NewsletterFormData
	locale: string
	action?: (formData: FormData) => Promise<void>
}

export function NewsletterForm({ mode, value, locale, action }: Props) {
	const isReadOnly = mode === 'read'
	const [form, setForm] = useState<NewsletterFormData>(value)

	return (
		<form action={action} className="space-y-6">
			{/* Hidden fields */}
			<input type="hidden" name="id" value={form.id ?? ''} />
			<input type="hidden" name="slug" value={form.slug} />
			<input type="hidden" name="intent" value={form.status} />

			<input type="hidden" name="locale" value={locale} />

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

			{/* Slug */}
			<Input
				value={form.slug}
				disabled={isReadOnly}
				placeholder="slug"
				onChange={(e) => setForm({ ...form, slug: e.target.value })}
			/>

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
								onClick={() => setForm((f) => ({ ...f, status: 'draft' }))}
							>
								Save Draft
							</Button>
							<Button
								type="submit"
								onClick={() =>
									setForm((f) => ({
										...f,
										status: 'published',
										publishedAt: f.publishedAt ?? new Date(),
									}))
								}
							>
								Publish
							</Button>
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
