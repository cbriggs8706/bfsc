'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, Copy } from 'lucide-react'

export function CopyEmailList({ text }: { text: string }) {
	const [copied, setCopied] = useState(false)

	async function handleCopy() {
		await navigator.clipboard.writeText(text)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	return (
		<Button
			type="button"
			variant="outline"
			size="sm"
			onClick={handleCopy}
			className="flex items-center gap-2"
		>
			{copied ? (
				<>
					<Check className="h-4 w-4 text-green-600" />
					Copied
				</>
			) : (
				<>
					<Copy className="h-4 w-4" />
					Copy all
				</>
			)}
		</Button>
	)
}
