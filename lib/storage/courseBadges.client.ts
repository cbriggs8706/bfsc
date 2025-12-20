export function getCourseBadgeUrlFromPath(badgeImagePath?: string | null) {
	if (!badgeImagePath) return null

	// Uses public bucket URL
	return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/course-badges/${badgeImagePath}`
}
