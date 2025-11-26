export function extractYouTubeId(url?: string | null): string | null {
	if (!url) return null
	try {
		const u = new URL(url)
		if (u.hostname.includes('youtu.be')) {
			return u.pathname.slice(1)
		}
		if (u.searchParams.has('v')) {
			return u.searchParams.get('v')
		}
	} catch {}
	return null
}
