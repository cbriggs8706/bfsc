export async function uploadCmsPageImage(file: File): Promise<string> {
	const formData = new FormData()
	formData.append('file', file)

	const res = await fetch('/api/admin/pages/upload', {
		method: 'POST',
		body: formData,
	})

	if (!res.ok) {
		let message = 'Upload failed'
		try {
			const data = (await res.json()) as { error?: string }
			if (data.error) message = data.error
		} catch {
			// Leave the fallback message in place.
		}
		throw new Error(message)
	}

	const data = (await res.json()) as { url?: string }
	if (!data.url) {
		throw new Error('Upload succeeded but no URL was returned')
	}

	return data.url
}
