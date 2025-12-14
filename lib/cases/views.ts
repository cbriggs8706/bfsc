// lib/cases/views.ts
import {
	Archive,
	CheckCircle,
	Clock,
	Eye,
	PauseCircle,
	Search,
	type LucideIcon,
} from 'lucide-react'

export const CASE_VIEWS = [
	{ key: 'open', icon: Clock },
	{ key: 'investigating', icon: Search },
	{ key: 'myInvestigating', icon: Search },
	{ key: 'waiting', icon: PauseCircle },
	{ key: 'solved', icon: CheckCircle },
	{ key: 'archived', icon: Archive },
	{ key: 'watching', icon: Eye },
] as const

export type CaseView = (typeof CASE_VIEWS)[number]['key']

export type CaseViewMeta = {
	key: CaseView
	icon: LucideIcon
}

export function isCaseView(value: unknown): value is CaseView {
	return (
		typeof value === 'string' &&
		(CASE_VIEWS as readonly CaseViewMeta[]).some((v) => v.key === value)
	)
}

export function parseCaseView(
	value: unknown,
	fallback: CaseView = 'open'
): CaseView {
	return isCaseView(value) ? value : fallback
}

export function titleCaseView(view: CaseView): string {
	return view.charAt(0).toUpperCase() + view.slice(1)
}
