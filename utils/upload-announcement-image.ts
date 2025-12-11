import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function uploadAnnouncementImage(file: File) {
	const fileName = `announcements/${crypto.randomUUID()}-${file.name}`

	const { data, error } = await supabase.storage
		.from('public')
		.upload(fileName, file, {
			cacheControl: '3600',
			upsert: false,
		})

	if (error) throw error

	const { data: urlData } = supabase.storage
		.from('public')
		.getPublicUrl(fileName)

	return urlData.publicUrl
}
