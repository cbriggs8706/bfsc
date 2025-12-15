// lib/tinymce/upload-image.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function uploadNewsletterImage(
	blob: Blob,
	fileName: string
): Promise<string> {
	const filePath = `newsletter/${Date.now()}-${fileName}`

	const { error } = await supabase.storage
		.from('newsletter-images')
		.upload(filePath, blob, {
			cacheControl: '3600',
			upsert: false,
		})

	if (error) {
		throw new Error(error.message)
	}

	const { data } = supabase.storage
		.from('newsletter-images')
		.getPublicUrl(filePath)

	return data.publicUrl
}
