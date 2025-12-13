// utils/upload-class-cover-image.ts
'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'

export async function uploadClassCoverImage(
	file: File
): Promise<{ publicUrl: string; filePath: string }> {
	const bucket = 'classes'

	const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
	const filename = `${crypto.randomUUID()}.${ext}`
	const path = `series/covers/${filename}`

	const arrayBuffer = await file.arrayBuffer()
	const bytes = new Uint8Array(arrayBuffer)

	const { error } = await supabaseAdmin.storage
		.from(bucket)
		.upload(path, bytes, {
			contentType: file.type || 'image/*',
			upsert: false,
		})

	if (error) {
		throw new Error(`Supabase upload failed: ${error.message}`)
	}

	const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path)
	if (!data.publicUrl) {
		throw new Error('Could not generate public URL for cover image')
	}

	return {
		publicUrl: data.publicUrl,
		filePath: path,
	}
}
