// components/cases/UseCaseCounts.tsx
'use client'

import { useEffect, useState } from 'react'
import type { CaseView } from '@/lib/cases/views'

export type CaseCounts = Record<CaseView, number>

type State =
	| { loading: true; counts: CaseCounts }
	| { loading: false; counts: CaseCounts }

const EMPTY: CaseCounts = {
	dashboard: 0,
	open: 0,
	investigating: 0,
	myInvestigating: 0,
	waiting: 0,
	solved: 0,
	archived: 0,
	watching: 0,
}

export function useCaseCounts() {
	const [state, setState] = useState<State>({ loading: true, counts: EMPTY })

	useEffect(() => {
		let cancelled = false

		async function run() {
			try {
				const res = await fetch('/api/cases/counts', { cache: 'no-store' })
				if (!res.ok) throw new Error(`Failed: ${res.status}`)

				const json = (await res.json()) as CaseCounts
				if (!cancelled) setState({ loading: false, counts: json })
			} catch {
				if (!cancelled) setState({ loading: false, counts: EMPTY })
			}
		}

		run()
		return () => {
			cancelled = true
		}
	}, [])

	return state
}
