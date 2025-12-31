'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

export function GenerateResetCodeButton({ userId }: { userId: string }) {
	const [open, setOpen] = useState(false)
	const [code, setCode] = useState<string | null>(null)

	async function generate() {
		const res = await fetch(`/api/admin/users/${userId}/password-reset-code`, {
			method: 'POST',
		})

		const data = await res.json()

		if (!res.ok) {
			toast.error(data.error ?? 'Failed to generate code')
			return
		}

		setCode(data.code)
		setOpen(true)
	}

	return (
		<>
			<Button size="sm" variant="outline" onClick={generate}>
				Reset Password
			</Button>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Temporary Reset Code</DialogTitle>
					</DialogHeader>

					<div className="text-center text-3xl font-mono tracking-widest">
						{code}
					</div>

					<p className="text-sm text-muted-foreground text-center mt-2">
						Expires in 1 hour. Give this code to the patron.
					</p>
				</DialogContent>
			</Dialog>
		</>
	)
}
