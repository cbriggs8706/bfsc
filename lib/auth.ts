// lib/auth.ts
import { getServerSession } from 'next-auth/next'
import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'

import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '@/db/client'

import {
	user as userTable,
	account,
	session,
	verificationToken,
} from '@/db/schema/tables/auth'

import { eq, or } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
	session: {
		strategy: 'jwt',
	},

	adapter: DrizzleAdapter(db, {
		usersTable: userTable,
		accountsTable: account,
		sessionsTable: session,
		verificationTokensTable: verificationToken,
	}),

	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
			allowDangerousEmailAccountLinking: true,
		}),

		CredentialsProvider({
			name: 'Credentials',
			credentials: {
				username: { label: 'Username or Email', type: 'text' },
				password: { label: 'Password', type: 'password' },
			},

			async authorize(credentials) {
				if (!credentials?.username || !credentials?.password) return null

				const dbUser = await db.query.user.findFirst({
					where: or(
						eq(userTable.username, credentials.username),
						eq(userTable.email, credentials.username)
					),
				})

				if (!dbUser || !dbUser.passwordHash) return null

				const valid = await bcrypt.compare(
					credentials.password,
					dbUser.passwordHash
				)
				if (!valid) return null

				return {
					id: dbUser.id,
					email: dbUser.email,
					name: dbUser.name ?? dbUser.username,
					role: dbUser.role ?? 'Patron',
					username: dbUser.username ?? 'dummy',
					image: dbUser.image ?? null,
					authProvider: 'credentials',
				}
			},
		}),
	],

	callbacks: {
		// You don't really need signIn logic if you always return true
		async signIn({ user, account }) {
			// You *could* add rules here later, but for now:
			return true
		},

		async jwt({ token, user, account }) {
			// console.log('💠 JWT CALLBACK — user:', user)
			// console.log('💠 JWT CALLBACK — token BEFORE:', token)
			// console.log('💠 JWT CALLBACK — account:', account)

			// On first login (credentials OR google), user is defined
			if (user) {
				const u = user as any // adapter user with extra fields

				token.id = u.id
				token.email = u.email
				token.name = u.name
				token.username = u.username ?? token.username ?? null
				token.role = u.role ?? token.role ?? 'Patron'
				token.image = u.image ?? token.image

				if (account?.provider) {
					token.authProvider = account.provider
				}

				// console.log('💠 JWT CALLBACK — token AFTER (with user):', token)
				return token
			}

			// Subsequent calls (no `user`) → just keep token as-is
			// console.log('💠 JWT CALLBACK — token AFTER (no user):', token)
			return token
		},

		async session({ session, token }) {
			if (session.user) {
				session.user.id = token.id as string
				session.user.role = token.role as string
				session.user.username = token.username as string
				session.user.email = token.email as string
				session.user.name = token.name as string
				session.user.image = token.image as string
				session.user.authProvider = token.authProvider as string
			}
			return session
		},

		async redirect({ url, baseUrl }) {
			// Let provider callback URLs go unmodified
			if (url.includes('/api/auth/callback')) return url

			// After successful login, just go to /en/dashboard for now
			return `${baseUrl}/en/home`
		},
	},
}

// --------------------------
// Utility functions
// --------------------------
export const getSession = () => getServerSession(authOptions)

export const getUserId = async () => {
	const s = await getSession()
	return s?.user?.id ?? null
}

export const getUserRole = async () => {
	const s = await getSession()
	return s?.user?.role ?? 'guest'
}

export const getCurrentUser = async () => {
	const session = await getSession()

	if (!session?.user?.id) return null

	return {
		id: session.user.id,
		role: session.user.role ?? 'Patron',
		name: session.user.name ?? 'User',
		email: session.user.email ?? '',
		username: session.user.username ?? null,
		image: session.user.image ?? null,
	}
}
