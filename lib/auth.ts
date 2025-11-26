// lib/auth.ts
import { getServerSession } from 'next-auth'
import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'

import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '@/db/client'

import {
	user,
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
		usersTable: user,
		accountsTable: account,
		sessionsTable: session,
		verificationTokensTable: verificationToken,
	}),

	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
						eq(user.username, credentials.username),
						eq(user.email, credentials.username)
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
					role: dbUser.role ?? 'user',
					username: dbUser.username ?? 'dummy',
					image: dbUser.image ?? null,
					authProvider: 'credentials',
				}
			},
		}),
	],

	callbacks: {
		async jwt({ token, user, account }) {
			if (user) {
				token.id = user.id
				token.role = user.role
				token.username = user.username
				token.email = user.email
				token.name = user.name
				token.image = user.image
			}
			if (account?.provider) {
				token.authProvider = account.provider // "google", "credentials"
			}
			if (user?.image) token.image = user.image

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
			// Redirect after Google or Credentials login
			if (url.includes('/api/auth/callback')) {
				const localeMatch = url.match(/\/([a-z]{2})\//)
				const locale = localeMatch ? localeMatch[1] : 'en'
				return `${baseUrl}/${locale}/dashboard`
			}

			return url
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
