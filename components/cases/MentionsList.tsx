'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { markMentionRead } from '@/app/actions/cases/mark-mention-read'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'

type Mention = {
	mentionId: string
	caseId: string
	commentId: string
	readAt: Date | null // ✅ FIXED
	commentBody: string | null
	caseTitle: string | null
	authorName: string | null
}

type Props = {
	locale: string
	initialMentions: Mention[]
}

export function MentionsList({ locale, initialMentions }: Props) {
	const [mentions, setMentions] = useState<Mention[]>(initialMentions)

	function dismiss(mentionId: string) {
		setMentions((m) => m.filter((x) => x.mentionId !== mentionId))
		void markMentionRead(mentionId)
	}

	function openMention(mentionId: string) {
		void markMentionRead(mentionId)
	}

	return (
		<div className="p-4 space-y-4 max-w-3xl">
			{mentions.length === 0 && (
				<Card className="p-3">
					<p className="text-muted-foreground">
						You&apos;re all caught up on mentions!
					</p>
				</Card>
			)}

			<div className="space-y-2">
				{mentions.map((m) => (
					<Card key={m.mentionId} className={!m.readAt ? 'bg-card' : ''}>
						<CardHeader className="flex flex-row items-start justify-between gap-2">
							<div className="text-sm font-semibold">
								{m.authorName ?? 'User'} mentioned you in{' '}
								<span className="font-bold">{m.caseTitle}</span>
							</div>

							<button
								onClick={() => dismiss(m.mentionId)}
								className="text-muted-foreground hover:text-foreground"
								aria-label="Mark as read"
							>
								<X className="h-4 w-4" />
							</button>
						</CardHeader>

						<CardContent>
							<p className="line-clamp-2 text-sm text-muted-foreground">
								{m.commentBody}
							</p>
						</CardContent>

						<CardFooter>
							<Link
								href={`/${locale}/cases/${m.caseId}#comment-${m.commentId}`}
								onClick={() => {
									void openMention(m.mentionId)
								}}
								className="text-sm text-primary"
							>
								View comment →
							</Link>
						</CardFooter>
					</Card>
				))}
			</div>
		</div>
	)
}
