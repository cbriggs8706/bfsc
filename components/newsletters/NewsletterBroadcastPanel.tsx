'use client'

import { useEffect, useMemo, useState } from 'react'
import { Editor } from '@tinymce/tinymce-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Props = {
	locale: string
	returnTo: string
	action: (formData: FormData) => Promise<void>
}

type PdfPreview = {
	name: string
	url: string
}

function monthInputValue(date: Date) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	return `${year}-${month}`
}

function monthLabel(month: string) {
	if (!/^\d{4}-\d{2}$/.test(month)) return 'Selected month'
	const [year, mon] = month.split('-').map(Number)
	return new Date(year, mon - 1, 1).toLocaleDateString('en-US', {
		month: 'long',
		year: 'numeric',
	})
}

export function NewsletterBroadcastPanel({ locale, returnTo, action }: Props) {
	const [files, setFiles] = useState<File[]>([])
	const [selectedMonth, setSelectedMonth] = useState(() =>
		monthInputValue(new Date())
	)
	const [messageHtml, setMessageHtml] = useState('<p></p>')

	const totalAttachmentMb = useMemo(() => {
		const bytes = files.reduce((sum, file) => sum + file.size, 0)
		return (bytes / (1024 * 1024)).toFixed(2)
	}, [files])

	const pdfFiles = useMemo(
		() =>
			files.filter(
				(file) =>
					file.type === 'application/pdf' ||
					file.name.toLowerCase().endsWith('.pdf')
			),
		[files]
	)

	const [pdfPreviews, setPdfPreviews] = useState<PdfPreview[]>([])

	useEffect(() => {
		const previews = pdfFiles.map((file) => ({
			name: file.name,
			url: URL.createObjectURL(file),
		}))
		setPdfPreviews(previews)

		return () => {
			for (const preview of previews) {
				URL.revokeObjectURL(preview.url)
			}
		}
	}, [pdfFiles])

	return (
		<div className="space-y-4">
			<form action={action} className="space-y-4">
				<input type="hidden" name="locale" value={locale} />
				<input type="hidden" name="returnTo" value={returnTo} />
				<input type="hidden" name="selectedMonth" value={selectedMonth} />

				<div className="grid gap-2 md:max-w-xs">
					<Label htmlFor="newsletter-email-month">Schedule month</Label>
					<Input
						id="newsletter-email-month"
						type="month"
						value={selectedMonth}
						onChange={(event) => setSelectedMonth(event.currentTarget.value)}
					/>
					<p className="text-xs text-muted-foreground">
						Previewing {monthLabel(selectedMonth)} schedule.
					</p>
				</div>

				<div className="grid gap-2">
					<Label htmlFor="newsletter-email-subject">Subject</Label>
					<Input
						id="newsletter-email-subject"
						name="subject"
						maxLength={180}
						placeholder="Monthly Newsletter - March 2026"
						required
					/>
				</div>

				<div className="grid gap-2">
					<Label htmlFor="newsletter-email-message">Message</Label>
					<input type="hidden" name="messageHtml" value={messageHtml} />
					<Editor
						id="newsletter-email-message"
						apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
						value={messageHtml}
						onEditorChange={(content) => setMessageHtml(content)}
						init={{
							height: 320,
							menubar: false,
							branding: false,
							plugins: ['lists'],
							toolbar:
								'undo redo | bold italic underline | alignleft aligncenter alignright | bullist numlist | removeformat',
							valid_elements:
								'p[style],br,strong/b,em/i,u,ul,ol,li,span[style]',
							valid_styles: {
								'*': 'text-align,font-weight,font-style,text-decoration',
							},
							forced_root_block: 'p',
							paste_as_text: false,
						}}
					/>
				</div>

				<div className="grid gap-2">
					<Label htmlFor="newsletter-email-attachments">
						Attachments (optional)
					</Label>
					<Input
						id="newsletter-email-attachments"
						name="attachments"
						type="file"
						multiple
						onChange={(event) =>
							setFiles(Array.from(event.currentTarget.files ?? []))
						}
					/>
					<p className="text-xs text-muted-foreground">
						Total selected: {files.length} file(s), {totalAttachmentMb} MB (server
						action limit is 8 MB total).
					</p>
					<p className="text-xs text-muted-foreground">
						The selected month&apos;s class schedule PDF is auto-attached at send
						time.
					</p>
				</div>

				{files.length > 0 ? (
					<div className="rounded-md border p-3">
						<p className="mb-2 text-sm font-medium">Selected attachments</p>
						<ul className="space-y-1 text-sm text-muted-foreground">
							{files.map((file) => (
								<li key={`${file.name}-${file.size}-${file.lastModified}`}>
									{file.name} ({(file.size / 1024).toFixed(0)} KB)
								</li>
							))}
						</ul>
					</div>
				) : null}

				<div className="flex flex-wrap justify-end gap-2">
					<Button type="submit" name="sendMode" value="test" variant="outline">
						Send Test Email To Me Only
					</Button>
					<Button type="submit" name="sendMode" value="full">
						Send To All Users + Newsletter Subscribers
					</Button>
				</div>
			</form>

			{pdfPreviews.length > 0 ? (
				<div className="space-y-3">
					<h3 className="text-base font-semibold">
						PDF Preview for {monthLabel(selectedMonth)}
					</h3>
					{pdfPreviews.map((preview) => (
						<div key={preview.url} className="space-y-2 rounded-md border p-3">
							<p className="text-sm font-medium">{preview.name}</p>
							<iframe
								src={preview.url}
								title={`Preview ${preview.name}`}
								className="h-[480px] w-full rounded border"
							/>
						</div>
					))}
				</div>
			) : null}

			<div className="space-y-2 rounded-md border p-3">
				<p className="text-sm font-medium">
					Month Preview: {monthLabel(selectedMonth)}
				</p>
				<iframe
					src={`/calendar/print?month=${selectedMonth}&includeClasses=1&includeReservations=0`}
					title={`Monthly schedule preview for ${monthLabel(selectedMonth)}`}
					className="h-[620px] w-full rounded border"
				/>
			</div>
		</div>
	)
}
