type VisitMeta = {
	visitReason?: 'patron' | 'training' | 'group'
	peopleCameWithVisitor?: number | null
}

function parseVisitMeta(notes: string | null | undefined): VisitMeta | null {
	if (!notes) return null

	try {
		const parsed = JSON.parse(notes) as VisitMeta
		return parsed && typeof parsed === 'object' ? parsed : null
	} catch {
		return null
	}
}

export function getVisitReportReason(input: {
	fullName: string
	purposeName: string | null
	notes?: string | null
}): string | null {
	const meta = parseVisitMeta(input.notes)
	const normalizedName = input.fullName.trim().toLowerCase()

	if (normalizedName === 'missionaries' && meta) {
		const count = Math.max(0, Math.floor(meta.peopleCameWithVisitor ?? 0))
		return String(count)
	}

	if (input.purposeName) return input.purposeName
	if (meta?.visitReason === 'training') return 'Training'
	if (meta?.visitReason === 'group') {
		const count = Math.max(0, Math.floor(meta.peopleCameWithVisitor ?? 0))
		return count > 0 ? `Group (${count})` : 'Group'
	}

	return null
}
