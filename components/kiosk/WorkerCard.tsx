// components/kiosk/WorkerCard.tsx

'use client'

import { CertificateSummary } from '@/types/training'
import { Card } from '../ui/card'
import Image from 'next/image'

interface WorkerCardProps {
	name: string
	imageUrl?: string | null
	certificates: CertificateSummary[]
	languages: string[]
}

export function WorkerCard({
	name,
	imageUrl,
	languages,
	certificates,
}: WorkerCardProps) {
	return (
		<Card className="flex flex-col items-center gap-2 p-4 text-center">
			<Image
				src={imageUrl ?? '/user.svg'}
				alt={name}
				width={96}
				height={96}
				className="rounded-full object-cover border"
			/>

			<span className="font-bold text-md">{name}</span>
			{languages && <span className="text-xs">{languages.join(', ')}</span>}
			{certificates.length > 0 && (
				<>
					<span className="font-xs text-sm">Can assist with:</span>

					<div className="flex flex-wrap gap-1 justify-center">
						{certificates.map((c) => (
							<span
								key={c.id}
								className="text-xs px-2 py-0.5 rounded-full bg-(--green-logo) text-white"
								title={c.title}
							>
								{c.title}
							</span>
						))}
					</div>
				</>
			)}
		</Card>
	)
}
