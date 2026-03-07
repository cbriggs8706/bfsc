import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const FALLBACK_ICON_NAME = 'Files'

function isLucideComponent(value: unknown) {
	return Boolean(
		value &&
			(typeof value === 'function' ||
				(typeof value === 'object' && '$$typeof' in (value as object)))
	)
}

export const CMS_ICON_NAMES = Object.keys(LucideIcons)
	.filter((key) => /^[A-Z]/.test(key))
	.filter((key) => !key.endsWith('Icon'))
	.filter((key) => {
		const candidate = LucideIcons[key as keyof typeof LucideIcons]
		return isLucideComponent(candidate)
	})
	.sort()

export function resolveCmsMenuIcon(iconName?: string | null): LucideIcon {
	const candidate = iconName
		? LucideIcons[iconName as keyof typeof LucideIcons]
		: null

	if (isLucideComponent(candidate)) {
		return candidate as LucideIcon
	}

	return LucideIcons[FALLBACK_ICON_NAME as keyof typeof LucideIcons] as LucideIcon
}
