// hooks/use-debounced-value.ts
import { useEffect } from 'react'

export function useDebouncedEffect(
	fn: () => void,
	deps: unknown[],
	delay = 300
) {
	useEffect(() => {
		const id = setTimeout(fn, delay)
		return () => clearTimeout(id)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [...deps, delay])
}
