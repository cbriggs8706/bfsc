// types/next-auth.d.ts
import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
	interface Session {
		user: DefaultSession['user'] & {
			id: string
			role: string
			username: string
			authProvider?: string
			mustResetPassword?: boolean
			isImpersonating?: boolean
			impersonatedBy?: {
				id: string
				role: string
				name: string
				email?: string | null
			}
		}
	}
}

export {}
