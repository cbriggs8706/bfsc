// lib/auth.ts
import { getServerSession } from 'next-auth/next'
import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'

import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '@/db'

import {
	user as userTable,
	account,
	session,
	verificationToken,
} from '@/db/schema/tables/auth'

import { eq, or } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

type AuthUserSnapshot = {
	id: string
	email: string | null
	name: string | null
	role: string | null
	username: string | null
	image: string | null
	mustResetPassword: boolean
}

type ImpersonationSessionUpdate = {
	impersonationAction?: 'start' | 'stop'
	impersonationUserId?: string
}

async function getAuthUserSnapshot(
	userId: string
): Promise<AuthUserSnapshot | null> {
	const user = await db.query.user.findFirst({
		where: eq(userTable.id, userId),
		columns: {
			id: true,
			email: true,
			name: true,
			role: true,
			username: true,
			image: true,
			mustResetPassword: true,
		},
	})

	return user ?? null
}

function applySnapshotToToken(
	token: Record<string, unknown>,
	user: AuthUserSnapshot
) {
	token.id = user.id
	token.email = user.email
	token.name = user.name ?? user.username ?? user.email ?? 'User'
	token.username = user.username ?? null
	token.role = user.role ?? 'Patron'
	token.image = user.image ?? null
	token.mustResetPassword = user.mustResetPassword
}

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
					mustResetPassword: dbUser.mustResetPassword,
					authProvider: 'credentials',
				}
			},
		}),
	],

	callbacks: {
		// You don't really need signIn logic if you always return true
		async signIn({ user }) {
			// Track successful sign-ins for admin visibility.
			try {
				if (user?.id) {
					await db
						.update(userTable)
						.set({ lastLoginAt: new Date() })
						.where(eq(userTable.id, user.id))
				} else if (user?.email) {
					await db
						.update(userTable)
						.set({ lastLoginAt: new Date() })
						.where(eq(userTable.email, user.email))
				}
			} catch (error) {
				console.error('Failed to update last_login_at on sign-in', error)
			}

			return true
		},

		async jwt({ token, user, account, trigger, session }) {
			// console.log('💠 JWT CALLBACK — user:', user)
			// console.log('💠 JWT CALLBACK — token BEFORE:', token)
			// console.log('💠 JWT CALLBACK — account:', account)

			if (trigger === 'update') {
				const update = session as ImpersonationSessionUpdate | undefined
				const actorId =
					(typeof token.impersonatorId === 'string' && token.impersonatorId) ||
					(typeof token.id === 'string' && token.id) ||
					null

				if (
					update?.impersonationAction === 'start' &&
					typeof update.impersonationUserId === 'string' &&
					actorId
				) {
					const [actorUser, targetUser] = await Promise.all([
						getAuthUserSnapshot(actorId),
						getAuthUserSnapshot(update.impersonationUserId),
					])

					if (actorUser?.role === 'Admin' && targetUser) {
						token.impersonatorId = actorUser.id
						token.impersonatorRole = actorUser.role ?? 'Admin'
						token.impersonatorName =
							actorUser.name ?? actorUser.username ?? actorUser.email ?? 'Admin'
						token.impersonatorEmail = actorUser.email
						applySnapshotToToken(token, targetUser)
					}

					return token
				}

				if (update?.impersonationAction === 'stop') {
					const originalActorId =
						typeof token.impersonatorId === 'string' ? token.impersonatorId : null

					if (originalActorId) {
						const actorUser = await getAuthUserSnapshot(originalActorId)
						if (actorUser) {
							applySnapshotToToken(token, actorUser)
						}
					}

					delete token.impersonatorId
					delete token.impersonatorRole
					delete token.impersonatorName
					delete token.impersonatorEmail

					return token
				}
			}

			// On first login (credentials OR google), user is defined
			if (user) {
				const u = user as {
					id?: string
					email?: string | null
					name?: string | null
					username?: string | null
					role?: string | null
					image?: string | null
					mustResetPassword?: boolean
				}

				token.id = u.id
				token.email = u.email
				token.name = u.name
				token.username = u.username ?? token.username ?? null
				token.role = u.role ?? token.role ?? 'Patron'
				token.image = u.image ?? token.image
				token.mustResetPassword =
					u.mustResetPassword ?? Boolean(token.mustResetPassword)
				token.authProvider = account?.provider ?? token.authProvider
				delete token.impersonatorId
				delete token.impersonatorRole
				delete token.impersonatorName
				delete token.impersonatorEmail

				// console.log('💠 JWT CALLBACK — token AFTER (with user):', token)
				return token
			}

			const effectiveUserId = typeof token.id === 'string' ? token.id : null
			const impersonatorId =
				typeof token.impersonatorId === 'string' ? token.impersonatorId : null

			if (effectiveUserId && impersonatorId) {
				const [effectiveUser, actorUser] = await Promise.all([
					getAuthUserSnapshot(effectiveUserId),
					getAuthUserSnapshot(impersonatorId),
				])

				if (effectiveUser) {
					applySnapshotToToken(token, effectiveUser)
				}

				if (actorUser) {
					token.impersonatorId = actorUser.id
					token.impersonatorRole = actorUser.role ?? token.impersonatorRole
					token.impersonatorName =
						actorUser.name ??
						actorUser.username ??
						actorUser.email ??
						token.impersonatorName
					token.impersonatorEmail =
						actorUser.email ?? (token.impersonatorEmail as string | undefined)
				}
			} else if (effectiveUserId) {
				const dbUser = await getAuthUserSnapshot(effectiveUserId)

				if (dbUser) {
					applySnapshotToToken(token, dbUser)
				}
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
				session.user.mustResetPassword = Boolean(token.mustResetPassword)
				session.user.isImpersonating = Boolean(token.impersonatorId)
				session.user.impersonatedBy =
					typeof token.impersonatorId === 'string'
						? {
								id: token.impersonatorId,
								role: (token.impersonatorRole as string | undefined) ?? 'Admin',
								name:
									(token.impersonatorName as string | undefined) ??
									'Administrator',
								email: (token.impersonatorEmail as string | null | undefined) ?? null,
							}
						: undefined
			}
			return session
		},

		async redirect({ url, baseUrl }) {
			// Allow relative redirects
			if (url.startsWith('/')) {
				return `${baseUrl}${url}`
			}

			// Allow same-origin absolute redirects
			if (url.startsWith(baseUrl)) {
				return url
			}

			// Fallback for anything unsafe
			return `${baseUrl}/en/dashboard`
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
		isImpersonating: session.user.isImpersonating ?? false,
		mustResetPassword: session.user.mustResetPassword ?? false,
		impersonatedBy: session.user.impersonatedBy ?? null,
	}
}
