'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { toggleLessonCompletion } from '@/app/actions/training'
import { UserLesson } from '@/types/training'

type Props = {
	lesson: UserLesson
	locale: string
}

export function LessonRow({ lesson, locale }: Props) {
	const router = useRouter()

	// 🔑 optimistic local state
	const [checked, setChecked] = useState<boolean>(lesson.isCompleted)

	return (
		<div className="flex items-center gap-3 border rounded p-2">
			<Checkbox
				checked={checked}
				onCheckedChange={async (value) => {
					const next = Boolean(value)

					// 1️⃣ update UI immediately
					setChecked(next)

					// 2️⃣ persist to server
					await toggleLessonCompletion(lesson.id, next)

					// 3️⃣ re-sync server state (quietly)
					router.refresh()
				}}
			/>

			<Link
				href={`/${locale}/training/lessons/${lesson.id}`}
				className="underline text-sm"
			>
				{lesson.title}
			</Link>
		</div>
	)
}
