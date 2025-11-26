// next-auth.d.ts
import { DefaultSession, DefaultUser } from 'next-auth'

declare module 'next-auth' {
	interface Session {
		user: {
			id: string
			role?: string
			username?: string | null
			authProvider?: string
		} & DefaultSession['user']
	}

	interface User extends DefaultUser {
		id: string
		role?: string
		username?: string | null
	}
}

declare module 'next-auth/jwt' {
	interface JWT {
		id?: string
		role?: string
	}
}
