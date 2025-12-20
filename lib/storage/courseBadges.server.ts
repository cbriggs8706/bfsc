import 'server-only'
import { supabaseAdmin } from '@/lib/supabase-admin'

export function getCourseBadgeUrl(badgeImagePath?: string | null) {
	if (!badgeImagePath) return null

	const { data } = supabaseAdmin.storage
		.from('course-badges')
		.getPublicUrl(badgeImagePath)

	return data.publicUrl
}
