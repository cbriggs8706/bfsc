// components/cases/CaseCard.tsx
'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageCircle } from 'lucide-react'

type Props = {
	title: string
	type: { name: string; icon?: string; color?: string }
	status: string
	commentCount: number
	updatedAt: Date
	submitterName: string
	onClick?: () => void
}

export function CaseCard({
	title,
	type,
	status,
	commentCount,
	updatedAt,
	submitterName,
	onClick,
}: Props) {
	return (
		<Card
			onClick={onClick}
			className="p-4 space-y-2 cursor-pointer active:scale-[0.99]"
		>
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2 text-sm font-medium">
					<span>{type.icon}</span>
					<span>{type.name}</span>
				</div>

				<Badge variant="secondary">{status}</Badge>
			</div>

			<div className="text-base font-semibold leading-tight">{title}</div>

			<div className="flex items-center justify-between text-sm text-muted-foreground">
				<span>By {submitterName}</span>

				<div className="flex items-center gap-1">
					<MessageCircle className="h-4 w-4" />
					{commentCount}
				</div>
			</div>

			<div className="text-xs text-muted-foreground">
				Updated {updatedAt.toLocaleString()}
			</div>
		</Card>
	)
}
