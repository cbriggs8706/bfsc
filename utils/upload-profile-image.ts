'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'

export async function uploadProfileImage(file: File): Promise<string> {
	const bucket = 'profile-images'

	const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
	const filename = `${crypto.randomUUID()}.${ext}`
	const path = `avatars/${filename}`

	const arrayBuffer = await file.arrayBuffer()
	const bytes = new Uint8Array(arrayBuffer)

	const { error } = await supabaseAdmin.storage
		.from(bucket)
		.upload(path, bytes, {
			contentType: file.type || 'image/*',
			upsert: false,
		})

	if (error) {
		throw new Error(`Profile image upload failed: ${error.message}`)
	}

	const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path)

	if (!data.publicUrl) {
		throw new Error('Could not generate profile image URL')
	}

	return data.publicUrl
}
