// components/kiosk/ConsultantCard.tsx
'use client'

import Image from 'next/image'
import { Card } from '@/components/ui/card'

interface ConsultantCardProps {
	name: string
	imageUrl?: string | null
}

export function ConsultantCard({ name, imageUrl }: ConsultantCardProps) {
	return (
		<Card className="flex flex-col items-center gap-2 p-4 text-center">
			<Image
				src={imageUrl ?? '/mascot.svg'}
				alt={name}
				width={96}
				height={96}
				className="rounded-full object-cover border"
			/>
			<span className="font-medium text-sm">{name}</span>
		</Card>
	)
}
