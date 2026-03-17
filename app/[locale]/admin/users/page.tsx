// app/[locale]/admin/users/page.tsx
import Link from 'next/link'
import { db } from '@/db'
import { user } from '@/db/schema/tables/auth'
import {
	Table,
	TableHeader,
	TableRow,
	TableHead,
	TableBody,
	TableCell,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { and, ilike, inArray, or, sql } from 'drizzle-orm'
import { requireRole } from '@/utils/require-role'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { GenerateResetCodeButton } from '@/components/auth/GenerateResetCodeButton'
import { sendAdminUsersEmail } from '@/app/actions/admin-users-email'
import { ImpersonateUserButton } from '@/components/admin/user/ImpersonateUserButton'

export const dynamic = 'force-dynamic'

const ROLES = [
	'Admin',
	'Director',
	'Assistant Director',
	'Worker',
	'Shift Lead',
	'Patron',
] as const

function toList(value: string | string[] | undefined) {
	if (!value) return []
	return Array.isArray(value) ? value : [value]
}

function firstValue(value: string | string[] | undefined) {
	return Array.isArray(value) ? value[0] : value
}

function sanitizeRoles(values: string[]) {
	return values
		.map((value) => value.trim())
		.filter((value): value is (typeof ROLES)[number] =>
			ROLES.includes(value as (typeof ROLES)[number])
		)
}

export default async function AdminUsersPage({
	params,
	searchParams,
}: {
	params: Promise<{ locale: string }>
	searchParams: Promise<{
		q?: string | string[]
		roles?: string | string[]
		page?: string | string[]
		mailStatus?: string | string[]
		mailCount?: string | string[]
		mailError?: string | string[]
	}>
}) {
	const { locale } = await params
	const query = await searchParams
	const session = await getServerSession(authOptions)
	const userRole = session?.user.role
	const canSendBulkUsersEmail = userRole === 'Admin' || userRole === 'Director'
	const canImpersonateUsers = userRole === 'Admin'

	// if (!['Admin', 'Director', 'Assistant Director'].includes(userRole)) {
	// 	return redirect(`/${locale}`)
	// }

	// TODO new access pattern
	await requireRole(
		locale,
		['Admin', 'Director', 'Assistant Director'],
		`/${locale}/admin/users`
	)

	const searchQuery = (firstValue(query.q) ?? '').trim()
	const selectedRoles = sanitizeRoles(toList(query.roles))
	const parsedPage = Number.parseInt(firstValue(query.page) ?? '1', 10)

	const filters = []
	if (searchQuery) {
		const pattern = `%${searchQuery}%`
		filters.push(
			or(
				ilike(user.name, pattern),
				ilike(user.email, pattern),
				ilike(user.username, pattern)
			)
		)
	}
	if (selectedRoles.length > 0) {
		filters.push(inArray(user.role, selectedRoles))
	}

	const whereClause = filters.length > 0 ? and(...filters) : undefined
	const [{ count: totalUsers }] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(user)
		.where(whereClause)

	const pageSize = 75
	const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize))
	const currentPage = Number.isFinite(parsedPage)
		? Math.min(Math.max(parsedPage, 1), totalPages)
		: 1
	const offset = (currentPage - 1) * pageSize

	const users = await db
		.select({
			id: user.id,
			name: user.name,
			email: user.email,
			username: user.username,
			role: user.role,
			lastLoginAt: user.lastLoginAt,
		})
		.from(user)
		.where(whereClause)
		.orderBy(
			sql`
			CASE ${user.role}
				WHEN 'Admin' THEN 1
				WHEN 'Director' THEN 2
				WHEN 'Assistant Director' THEN 3
				WHEN 'Shift Lead' THEN 4
				WHEN 'Worker' THEN 5
				WHEN 'Patron' THEN 7
				ELSE 8
			END
		`,
			sql`COALESCE(${user.name}, ${user.email}) ASC`
		)
		.limit(pageSize)
		.offset(offset)

	const mailStatus = firstValue(query.mailStatus)
	const mailCount = firstValue(query.mailCount)
	const mailError = firstValue(query.mailError)

	function canEditUser(viewerRole?: string, targetRole?: string) {
		if (!viewerRole || !targetRole) return false

		switch (viewerRole) {
			case 'Admin':
				return [
					'Admin',
					'Director',
					'Assistant Director',
					'Shift Lead',
					'Worker',
					'Patron',
				].includes(targetRole)

			case 'Director':
				return !['Admin'].includes(targetRole)

			case 'Assistant Director':
				return !['Admin', 'Director', 'Assistant Director'].includes(targetRole)

			default:
				return false
		}
	}

	function formatShortDate(date: Date | null) {
		if (!date) return '—'
		return date.toLocaleDateString('en-US', {
			month: '2-digit',
			day: '2-digit',
			year: '2-digit',
		})
	}

	const baseQueryParams = new URLSearchParams()
	if (searchQuery) baseQueryParams.set('q', searchQuery)
	for (const role of selectedRoles) {
		baseQueryParams.append('roles', role)
	}
	if (currentPage > 1) baseQueryParams.set('page', String(currentPage))
	const returnTo = `/${locale}/admin/users${
		baseQueryParams.toString() ? `?${baseQueryParams.toString()}` : ''
	}`

	function usersUrl(page: number) {
		const params = new URLSearchParams()
		if (searchQuery) params.set('q', searchQuery)
		for (const role of selectedRoles) {
			params.append('roles', role)
		}
		if (page > 1) params.set('page', String(page))
		return `/${locale}/admin/users${params.toString() ? `?${params.toString()}` : ''}`
	}

	function getUserLabel(u: {
		name: string | null
		email: string | null
		username: string | null
	}) {
		return u.name ?? u.email ?? u.username ?? 'this user'
	}

	return (
		<div className="p-4 space-y-4">
			<div>
				<h1 className="text-3xl font-bold">Manage Users</h1>
				<p className="text-sm text-muted-foreground">
					Use this judiciously! Any changes to an email address or username can
					lock someone out of their account. Any changes to a role will require
					them to logout and back in for those changes to take effect.
				</p>
			</div>

			{mailStatus === 'sent' && (
				<div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
					Email sent to {mailCount ?? '0'} recipient(s).
				</div>
			)}

			{mailStatus === 'error' && (
				<div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
					{mailError ?? 'Email send failed.'}
				</div>
			)}

			<Card>
				<CardContent className="pt-6">
					<form method="get" className="space-y-4">
						<div className="grid gap-3 md:grid-cols-[2fr_1fr]">
							<Input
								name="q"
								defaultValue={searchQuery}
								placeholder="Search name, email, or username"
							/>
							<div className="flex gap-2">
								<Button type="submit" className="w-full md:w-auto">
									Apply Filters
								</Button>
								<Link href={`/${locale}/admin/users`} className="w-full md:w-auto">
									<Button type="button" variant="outline" className="w-full">
										Clear
									</Button>
								</Link>
							</div>
						</div>

						<div className="flex flex-wrap gap-4">
							{ROLES.map((role) => (
								<label key={role} className="inline-flex items-center gap-2 text-sm">
									<input
										type="checkbox"
										name="roles"
										value={role}
										defaultChecked={selectedRoles.includes(role)}
									/>
									<span>{role}</span>
								</label>
							))}
						</div>
					</form>

					<p className="mt-3 text-sm text-muted-foreground">
						Showing {users.length} user(s) on this page, {totalUsers} matching
						the current filters.
					</p>
				</CardContent>
			</Card>

			{canSendBulkUsersEmail ? (
				<Card>
					<CardHeader>
						<h2 className="text-xl font-semibold">Send Email</h2>
						<p className="text-sm text-muted-foreground">
							Choose selected rows on this page or send to all users matching the
							current filters.
						</p>
					</CardHeader>
					<CardContent>
						<form
							id="bulk-email-form"
							action={sendAdminUsersEmail}
							className="space-y-4"
						>
							<input type="hidden" name="locale" value={locale} />
							<input type="hidden" name="returnTo" value={returnTo} />
							<input type="hidden" name="searchQuery" value={searchQuery} />
							{selectedRoles.map((role) => (
								<input key={role} type="hidden" name="filteredRoles" value={role} />
							))}

							<div className="space-y-2">
								<label className="flex items-center gap-2 text-sm">
									<input
										type="radio"
										name="selectionMode"
										value="manual"
										defaultChecked
									/>
									<span>Selected users on this page</span>
								</label>
								<label className="flex items-center gap-2 text-sm">
									<input type="radio" name="selectionMode" value="filtered" />
									<span>All users matching current filters ({totalUsers})</span>
								</label>
								<label className="flex items-center gap-2 text-sm">
									<input type="checkbox" name="includeNewsletter" />
									<span>
										Also include confirmed newsletter subscribers who are not
										users
									</span>
								</label>
							</div>

							<div className="grid gap-3">
								<Input
									name="subject"
									placeholder="Email subject"
									required
									maxLength={180}
								/>
								<Textarea
									name="message"
									placeholder="Write your email message here..."
									required
									rows={8}
								/>
							</div>

							<div className="flex items-center justify-between gap-2">
								<p className="text-xs text-muted-foreground">
									Recipient emails are deduplicated automatically.
								</p>
								<Button type="submit">Send Email</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			) : null}

			<Card>
				<CardHeader className="flex items-center justify-end mb-4">
					<Link href={`/${locale}/admin/users/create`}>
						<Button>Add User</Button>
					</Link>
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									{canSendBulkUsersEmail ? (
										<TableHead className="w-[60px]">Pick</TableHead>
									) : null}
									<TableHead>Name</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>Role</TableHead>
									<TableHead>Last Login</TableHead>
									<TableHead className="w-[120px] text-right">
										Actions
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{users.map((u) => (
									<TableRow key={u.id}>
										{canSendBulkUsersEmail ? (
											<TableCell>
												<input
													type="checkbox"
													name="selectedUserIds"
													value={u.id}
													form="bulk-email-form"
												/>
											</TableCell>
										) : null}
										<TableCell>{u.name ?? '—'}</TableCell>
										<TableCell className="">{u.email ?? '—'}</TableCell>
										<TableCell className="capitalize">{u.role}</TableCell>
										<TableCell>{formatShortDate(u.lastLoginAt)}</TableCell>
										<TableCell className="text-right">
											{canEditUser(userRole, u.role) ? (
												<div className="flex gap-2 justify-end">
													{canImpersonateUsers ? (
														<ImpersonateUserButton
															userId={u.id}
															userLabel={getUserLabel(u)}
															locale={locale}
															disabled={session?.user?.id === u.id}
														/>
													) : null}

													<Link href={`/${locale}/admin/users/${u.id}/update`}>
														<Button size="sm" variant="outline">
															Edit
														</Button>
													</Link>

													<GenerateResetCodeButton userId={u.id} />
												</div>
											) : (
												<Button size="sm" variant="outline" disabled>
													Edit
												</Button>
											)}
										</TableCell>
									</TableRow>
								))}

								{users.length === 0 && (
									<TableRow>
										<TableCell
											colSpan={canSendBulkUsersEmail ? 6 : 5}
											className="text-center text-sm"
										>
											No users found.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>

					<div className="mt-4 flex items-center justify-between gap-2">
						{currentPage <= 1 ? (
							<Button variant="outline" disabled>
								Previous
							</Button>
						) : (
							<Button asChild variant="outline">
								<Link href={usersUrl(currentPage - 1)}>Previous</Link>
							</Button>
						)}

						<p className="text-sm text-muted-foreground">
							Page {currentPage} of {totalPages}
						</p>

						{currentPage >= totalPages ? (
							<Button variant="outline" disabled>
								Next
							</Button>
						) : (
							<Button asChild variant="outline">
								<Link href={usersUrl(currentPage + 1)}>Next</Link>
							</Button>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
