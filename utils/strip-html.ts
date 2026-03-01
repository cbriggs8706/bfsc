export function stripHtml(html: string): string {
	return html
		.replace(/&nbsp;|&#160;/gi, ' ')
		.replace(/\u00a0/g, ' ')
		.replace(/<[^>]+>/g, '')
		.replace(/\s+/g, ' ')
		.trim()
}
