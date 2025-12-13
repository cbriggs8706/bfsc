//TODO delete?

'use client'

import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export function SignOutButton() {
	const router = useRouter()

	return (
		<Button
			variant="destructive"
			onClick={async () => {
				await signOut({ redirect: false })
				router.push('/')
			}}
			className="flex items-center gap-2"
		>
			<LogOut className="h-4 w-4" />
			Sign Out
		</Button>
	)
}
