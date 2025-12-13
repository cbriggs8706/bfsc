// components/cases/CaseFeed.tsx
'use client'

import { CaseCard } from './CaseCard'
import { useRouter } from 'next/navigation'

type CaseItem = {
	id: string
	title: string
	status: string
	updatedAt: Date
	commentCount: number
	submitterName: string
	type: {
		name: string
		icon?: string
		color?: string
	}
}

type Props = {
	watched: CaseItem[]
	needsAttention: CaseItem[]
	allActive: CaseItem[]
	locale: string
}

export function CaseFeed({
	watched,
	needsAttention,
	allActive,
	locale,
}: Props) {
	const router = useRouter()

	function handleSelect(id: string) {
		router.push(`/${locale}/cases/${id}`)
	}

	return (
		<div className="space-y-6 pb-24">
			{watched.length > 0 ? (
				<Section title="⭐ My Watched">
					{watched.map((c) => (
						<CaseCard key={c.id} {...c} onClick={() => handleSelect(c.id)} />
					))}
				</Section>
			) : (
				<EmptyState message="You’re not watching any cases yet." />
			)}

			{needsAttention.length > 0 && (
				<Section title="⚠️ Needs Attention">
					{needsAttention.map((c) => (
						<CaseCard key={c.id} {...c} onClick={() => handleSelect(c.id)} />
					))}
				</Section>
			)}

			<Section title="📋 All Active">
				{allActive.length > 0 ? (
					allActive.map((c) => (
						<CaseCard key={c.id} {...c} onClick={() => handleSelect(c.id)} />
					))
				) : (
					<EmptyState message="No cases have been created yet." />
				)}
			</Section>
		</div>
	)
}

function Section({
	title,
	children,
}: {
	title: string
	children: React.ReactNode
}) {
	return (
		<div className="space-y-3">
			<h2 className="px-1 text-sm font-semibold text-muted-foreground">
				{title}
			</h2>
			<div className="space-y-3">{children}</div>
		</div>
	)
}

function EmptyState({ message }: { message: string }) {
	return (
		<div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
			{message}
		</div>
	)
}
