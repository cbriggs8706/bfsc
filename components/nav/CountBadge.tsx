// components/nav/CountBadge.tsx
export function CountBadge({ count }: { count: number }) {
	if (count <= 0) return null

	return (
		<span className="h-5 min-w-5 rounded-full bg-red-500 px-1 text-[11px] text-white flex items-center justify-center">
			{count}
		</span>
	)
}
