// utils/upload-announcement-image.ts
'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'

export async function uploadAnnouncementImage(file: File): Promise<string> {
	const bucket = 'announcements'

	const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
	const filename = `${crypto.randomUUID()}.${ext}`
	const path = `images/${filename}`

	const arrayBuffer = await file.arrayBuffer()
	const bytes = new Uint8Array(arrayBuffer)

	const { error: uploadError } = await supabaseAdmin.storage
		.from(bucket)
		.upload(path, bytes, {
			contentType: file.type || 'image/*',
			upsert: false,
		})

	if (uploadError) {
		throw new Error(`Supabase upload failed: ${uploadError.message}`)
	}

	// If the bucket is PUBLIC, this gives a permanent URL:
	const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path)
	if (!data.publicUrl) {
		throw new Error('Could not generate public URL for uploaded image')
	}

	return data.publicUrl
}
