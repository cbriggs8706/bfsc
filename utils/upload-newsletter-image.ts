export type NewsletterUploadKind = 'cover' | 'content'

export async function uploadNewsletterImage(
	file: File,
	kind: NewsletterUploadKind
): Promise<string> {
	const formData = new FormData()
	formData.append('file', file)
	formData.append('kind', kind)

	const res = await fetch('/api/admin/newsletters/upload', {
		method: 'POST',
		body: formData,
	})

	if (!res.ok) {
		let message = 'Upload failed'
		try {
			const data = (await res.json()) as { error?: string }
			if (data.error) message = data.error
		} catch {
			// Ignore JSON parse failure and use fallback message.
		}
		throw new Error(message)
	}

	const data = (await res.json()) as { url?: string }
	if (!data.url) {
		throw new Error('Upload succeeded but no URL was returned')
	}

	return data.url
}
