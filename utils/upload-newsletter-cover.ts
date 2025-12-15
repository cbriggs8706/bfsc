// utils/upload-newsletter-cover.ts
'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'

export async function uploadNewsletterCover(file: File): Promise<string> {
	const bucket = 'newsletter-covers'

	const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
	const filename = `${crypto.randomUUID()}.${ext}`
	const path = `covers/${filename}`

	const arrayBuffer = await file.arrayBuffer()
	const bytes = new Uint8Array(arrayBuffer)

	const { error } = await supabaseAdmin.storage
		.from(bucket)
		.upload(path, bytes, {
			contentType: file.type || 'image/*',
			upsert: false,
		})

	if (error) {
		throw new Error(`Cover upload failed: ${error.message}`)
	}

	const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path)

	if (!data.publicUrl) {
		throw new Error('Could not generate cover image URL')
	}

	return data.publicUrl
}
