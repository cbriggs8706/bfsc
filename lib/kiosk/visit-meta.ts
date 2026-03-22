export type VisitReason = 'patron' | 'training' | 'group'

export type VisitMeta = {
	visitReason: VisitReason
	partOfFaithGroup: boolean | null
	faithGroupName: string | null
	stakeName: string | null
	wardName: string | null
	peopleCameWithVisitor: number
}

type VisitMetaInput = Omit<Partial<VisitMeta>, 'peopleCameWithVisitor'> & {
	visitReason?: VisitReason
	peopleCameWithVisitor?: number | null
}

function normalizeString(value: unknown): string | null {
	if (typeof value !== 'string') return null
	const trimmed = value.trim()
	return trimmed.length > 0 ? trimmed : null
}

export function normalizeVisitMeta(input?: VisitMetaInput | null): VisitMeta {
	const faithGroupName = normalizeString(input?.faithGroupName)
	const stakeName = normalizeString(input?.stakeName)
	const wardName = normalizeString(input?.wardName)
	const peopleCameWithVisitor = Math.max(
		0,
		Math.floor(
			typeof input?.peopleCameWithVisitor === 'number'
				? input.peopleCameWithVisitor
				: 0
		)
	)

	let partOfFaithGroup: boolean | null =
		typeof input?.partOfFaithGroup === 'boolean'
			? input.partOfFaithGroup
			: null

	if (partOfFaithGroup === null && (faithGroupName || stakeName || wardName)) {
		partOfFaithGroup = true
	}

	return {
		visitReason:
			input?.visitReason === 'training' || input?.visitReason === 'group'
				? input.visitReason
				: 'patron',
		partOfFaithGroup,
		faithGroupName,
		stakeName,
		wardName,
		peopleCameWithVisitor,
	}
}

export function hasVisitMeta(meta: VisitMeta): boolean {
	return Boolean(
		meta.visitReason !== 'patron' ||
			meta.partOfFaithGroup !== null ||
			meta.faithGroupName ||
			meta.stakeName ||
			meta.wardName ||
			meta.peopleCameWithVisitor > 0
	)
}

export function parseVisitMeta(notes: string | null | undefined): VisitMeta | null {
	if (!notes) return null

	try {
		const parsed = JSON.parse(notes) as VisitMetaInput
		if (!parsed || typeof parsed !== 'object') return null

		const normalized = normalizeVisitMeta(parsed)
		return hasVisitMeta(normalized) ? normalized : null
	} catch {
		return null
	}
}

export function serializeVisitMeta(input?: VisitMetaInput | null): string | null {
	const normalized = normalizeVisitMeta(input)
	return hasVisitMeta(normalized) ? JSON.stringify(normalized) : null
}
