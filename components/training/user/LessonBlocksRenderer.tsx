'use client'

import { AnyLessonBlock, LessonBlock } from '@/types/training'
import Image from 'next/image'

type Props = {
	blocks: AnyLessonBlock[]
}

export function LessonBlocksRenderer({ blocks }: Props) {
	return (
		<div className="space-y-4">
			{blocks.map((block) => {
				switch (block.type) {
					case 'text':
						return <TextBlock key={block.id} block={block} />
					case 'image':
						return <ImageBlock key={block.id} block={block} />
					case 'link':
						return <LinkBlock key={block.id} block={block} />
				}
			})}
		</div>
	)
}

function TextBlock({ block }: { block: LessonBlock<'text'> }) {
	return (
		<div>
			{block.data.title && (
				<h3 className="font-semibold mb-1">{block.data.title}</h3>
			)}
			<p className="whitespace-pre-wrap">{block.data.bodyMarkdown}</p>
		</div>
	)
}

function ImageBlock({ block }: { block: LessonBlock<'image'> }) {
	return (
		<figure className="space-y-2">
			<div className="relative w-full max-w-3xl aspect-video">
				<Image
					src={block.data.path}
					alt={block.data.alt ?? ''}
					fill
					sizes="(max-width: 768px) 100vw, 768px"
					className="object-contain rounded"
					priority={false}
				/>
			</div>

			{block.data.caption && (
				<figcaption className="text-sm text-muted-foreground">
					{block.data.caption}
				</figcaption>
			)}
		</figure>
	)
}

function LinkBlock({ block }: { block: LessonBlock<'link'> }) {
	return (
		<a
			href={block.data.url}
			target="_blank"
			rel="noreferrer"
			className="underline text-primary"
		>
			{block.data.label ?? block.data.url}
		</a>
	)
}
