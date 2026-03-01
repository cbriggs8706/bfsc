const LETTER_PATTERN = /[A-Za-zÀ-ÖØ-öø-ÿ]/g
const WORD_PATTERN = /[A-Za-zÀ-ÖØ-öø-ÿ]+/g

function titleCaseWords(value: string): string {
	return value.replace(WORD_PATTERN, (word) => {
		if (!word) return word
		return `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`
	})
}

export function normalizeFullNameForStorage(value: string): string {
	const collapsed = value.trim().replace(/\s+/g, ' ')
	return titleCaseWords(collapsed)
}

export function toDisplayFullName(value: string): string {
	const collapsed = value.trim().replace(/\s+/g, ' ')
	const letters = collapsed.match(LETTER_PATTERN) ?? []
	const isAllCaps =
		letters.length > 0 &&
		letters.every((char) => char === char.toUpperCase())

	return isAllCaps ? titleCaseWords(collapsed) : collapsed
}
