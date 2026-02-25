'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'

export async function uploadCenterHeroImage(file: File): Promise<string> {
	const bucket = 'center'

	const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
	const filename = `${crypto.randomUUID()}.${ext}`
	const path = `hero/${filename}`

	const arrayBuffer = await file.arrayBuffer()
	const bytes = new Uint8Array(arrayBuffer)

	const { error } = await supabaseAdmin.storage
		.from(bucket)
		.upload(path, bytes, {
			contentType: file.type || 'image/*',
			upsert: false,
		})

	if (error) {
		throw new Error(`Center hero image upload failed: ${error.message}`)
	}

	const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path)
	if (!data.publicUrl) {
		throw new Error('Could not generate center hero image URL')
	}

	return data.publicUrl
}
