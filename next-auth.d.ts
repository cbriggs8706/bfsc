// next-auth.d.ts
import { DefaultSession, DefaultUser } from 'next-auth'

declare module 'next-auth' {
	interface Session {
		user: {
			id: string
			role?: string
			username?: string | null
			authProvider?: string
			mustResetPassword?: boolean
			isImpersonating?: boolean
			impersonatedBy?: {
				id: string
				role: string
				name: string
				email?: string | null
			}
		} & DefaultSession['user']
	}

	interface User extends DefaultUser {
		id: string
		role?: string
		username?: string | null
		mustResetPassword?: boolean
	}
}

declare module 'next-auth/jwt' {
	interface JWT {
		id?: string
		role?: string
		username?: string | null
		email?: string | null
		name?: string | null
		image?: string | null
		authProvider?: string
		mustResetPassword?: boolean
		impersonatorId?: string
		impersonatorRole?: string
		impersonatorName?: string
		impersonatorEmail?: string | null
	}
}
