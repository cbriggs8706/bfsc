// components/cases/CaseAttachments.tsx
'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { AttachmentViewer } from './AttachmentViewer'
import { Attachment } from '@/types/cases'

export function CaseAttachments({
	attachments,
}: {
	attachments: Attachment[]
}) {
	const [activeIndex, setActiveIndex] = useState<number | null>(null)

	if (!attachments.length) return null

	return (
		<>
			<div className="grid grid-cols-3 gap-2">
				{attachments.map((a, i) => (
					<button
						key={a.id}
						onClick={() => setActiveIndex(i)}
						className="relative aspect-square overflow-hidden rounded-md bg-muted"
					>
						<Image
							src={a.fileUrl}
							alt="Attachment"
							fill
							className="object-cover"
						/>
					</button>
				))}
			</div>

			{activeIndex !== null && (
				<AttachmentViewer
					attachments={attachments}
					index={activeIndex}
					onClose={() => setActiveIndex(null)}
				/>
			)}
		</>
	)
}
