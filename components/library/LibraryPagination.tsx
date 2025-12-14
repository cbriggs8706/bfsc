// components/library/LibraryPagination.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function LibraryPagination({
	page,
	pageSize,
	total,
}: {
	page: number
	pageSize: number
	total: number
}) {
	const router = useRouter()
	const params = useSearchParams()
	const pages = Math.ceil(total / pageSize)

	if (pages <= 1) return null

	function go(p: number) {
		const next = new URLSearchParams(params)
		next.set('page', String(p))
		router.push(`?${next.toString()}`)
	}

	return (
		<div className="flex justify-center gap-2 pt-4">
			<Button
				size="sm"
				variant="outline"
				disabled={page <= 1}
				onClick={() => go(page - 1)}
			>
				Prev
			</Button>

			<span className="text-sm pt-2">
				Page {page} of {pages}
			</span>

			<Button
				size="sm"
				variant="outline"
				disabled={page >= pages}
				onClick={() => go(page + 1)}
			>
				Next
			</Button>
		</div>
	)
}
