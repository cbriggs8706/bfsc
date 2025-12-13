// components/cases/AttachmentViewer.tsx
'use client'

import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

type Attachment = {
	id: string
	fileUrl: string
	fileType: string
}

export function AttachmentViewer({
	attachments,
	index,
	onClose,
}: {
	attachments: Attachment[]
	index: number
	onClose: () => void
}) {
	const [current, setCurrent] = useState(index)

	function prev() {
		setCurrent((c) => Math.max(0, c - 1))
	}

	function next() {
		setCurrent((c) => Math.min(attachments.length - 1, c + 1))
	}

	const attachment = attachments[current]

	return (
		<div className="fixed inset-0 z-50 bg-black">
			<div className="absolute top-4 right-4 z-50">
				<button onClick={onClose}>
					<X className="h-6 w-6 text-white" />
				</button>
			</div>

			{current > 0 && (
				<button
					onClick={prev}
					className="absolute left-2 top-1/2 -translate-y-1/2 z-50"
				>
					<ChevronLeft className="h-8 w-8 text-white" />
				</button>
			)}

			{current < attachments.length - 1 && (
				<button
					onClick={next}
					className="absolute right-2 top-1/2 -translate-y-1/2 z-50"
				>
					<ChevronRight className="h-8 w-8 text-white" />
				</button>
			)}

			<div className="relative h-full w-full">
				<Image
					src={attachment.fileUrl}
					alt="Attachment"
					fill
					className="object-contain"
					priority
				/>
			</div>
		</div>
	)
}
