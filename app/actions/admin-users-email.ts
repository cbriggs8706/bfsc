'use server'

import { and, eq, ilike, inArray, isNull, or } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { user } from '@/db/schema/tables/auth'
import { newsletterSubscribers } from '@/db/schema/tables/newsletters'
import { sendEmail } from '@/lib/email/mailer'
import { requireRole } from '@/utils/require-role'

const ALLOWED_ROLES = [
	'Admin',
	'Director',
	'Assistant Director',
	'Worker',
	'Shift Lead',
	'Patron',
] as const

type AllowedRole = (typeof ALLOWED_ROLES)[number]

const FROM_EMAIL =
	'Burley FamilySearch Center <no-reply@burleyfamilysearchcenter.com>'
const RECIPIENT_BATCH_SIZE = 80

function isAllowedRole(value: string): value is AllowedRole {
	return ALLOWED_ROLES.includes(value as AllowedRole)
}

function normalizeRoles(values: string[]) {
	return values.map((value) => value.trim()).filter(isAllowedRole)
}

function escapeHtml(input: string) {
	return input
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;')
}

function toHtmlMessage(body: string) {
	return escapeHtml(body).replaceAll(/\r\n|\n|\r/g, '<br />')
}

function splitIntoBatches(values: string[], size: number) {
	const batches: string[][] = []
	for (let index = 0; index < values.length; index += size) {
		batches.push(values.slice(index, index + size))
	}
	return batches
}

function buildRedirectUrl(
	returnTo: string,
	status: 'sent' | 'error',
	detail: string
) {
	const safePath = returnTo.startsWith('/') ? returnTo : '/en/admin/users'
	const url = new URL(safePath, 'http://localhost')
	url.searchParams.set('mailStatus', status)
	if (status === 'sent') {
		url.searchParams.set('mailCount', detail)
	} else {
		url.searchParams.set('mailError', detail)
	}
	return `${url.pathname}?${url.searchParams.toString()}`
}

async function getFilteredUserEmails(searchQuery: string, roles: string[]) {
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

	if (roles.length > 0) {
		filters.push(inArray(user.role, roles))
	}

	const rows = await db
		.select({ email: user.email })
		.from(user)
		.where(filters.length > 0 ? and(...filters) : undefined)

	return rows
		.map((row) => row.email.trim().toLowerCase())
		.filter((email) => email.length > 0)
}

async function getSelectedUserEmails(selectedIds: string[]) {
	if (selectedIds.length === 0) return []

	const rows = await db
		.select({ email: user.email })
		.from(user)
		.where(inArray(user.id, selectedIds))

	return rows
		.map((row) => row.email.trim().toLowerCase())
		.filter((email) => email.length > 0)
}

async function getNewsletterNonUserEmails() {
	const [allUserRows, subscriberRows] = await Promise.all([
		db.select({ email: user.email }).from(user),
		db
			.select({ email: newsletterSubscribers.email })
			.from(newsletterSubscribers)
			.where(
				and(
					eq(newsletterSubscribers.isConfirmed, true),
					isNull(newsletterSubscribers.unsubscribedAt)
				)
			),
	])

	const userEmailSet = new Set(
		allUserRows
			.map((row) => row.email.trim().toLowerCase())
			.filter((email) => email.length > 0)
	)

	return subscriberRows
		.map((row) => row.email.trim().toLowerCase())
		.filter((email) => email.length > 0 && !userEmailSet.has(email))
}

export async function sendAdminUsersEmail(formData: FormData) {
	const locale = String(formData.get('locale') ?? 'en')
	const returnTo = String(formData.get('returnTo') ?? `/${locale}/admin/users`)

	try {
		await requireRole(
			locale,
			['Admin', 'Director'],
			`/${locale}/admin/users`
		)

		const selectionMode = String(formData.get('selectionMode') ?? 'manual')
		const includeNewsletter = formData.get('includeNewsletter') === 'on'
		const selectedUserIds = formData
			.getAll('selectedUserIds')
			.map((value) => String(value))
			.filter((value) => value.length > 0)
		const filteredRoles = normalizeRoles(
			formData.getAll('filteredRoles').map((value) => String(value))
		)
		const searchQuery = String(formData.get('searchQuery') ?? '').trim()
		const subject = String(formData.get('subject') ?? '').trim()
		const message = String(formData.get('message') ?? '').trim()

		if (!subject) {
			redirect(buildRedirectUrl(returnTo, 'error', 'Subject is required.'))
		}
		if (!message) {
			redirect(buildRedirectUrl(returnTo, 'error', 'Message is required.'))
		}

		const userRecipients =
			selectionMode === 'filtered'
				? await getFilteredUserEmails(searchQuery, filteredRoles)
				: await getSelectedUserEmails(selectedUserIds)

		const newsletterRecipients = includeNewsletter
			? await getNewsletterNonUserEmails()
			: []

		const recipients = [...new Set([...userRecipients, ...newsletterRecipients])]

		if (recipients.length === 0) {
			redirect(
				buildRedirectUrl(
					returnTo,
					'error',
					'No recipients matched your current selection.'
				)
			)
		}

		const html = `
			<div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6;">
				${toHtmlMessage(message)}
			</div>
		`

		for (const batch of splitIntoBatches(recipients, RECIPIENT_BATCH_SIZE)) {
			await sendEmail({
				from: FROM_EMAIL,
				to: batch,
				subject,
				html,
			})
		}

		redirect(buildRedirectUrl(returnTo, 'sent', String(recipients.length)))
	} catch (error) {
		const maybeRedirectDigest =
			typeof error === 'object' && error !== null && 'digest' in error
				? String((error as { digest?: unknown }).digest)
				: ''
		if (maybeRedirectDigest.startsWith('NEXT_REDIRECT')) throw error
		console.error('Failed to send admin user email', error)
		redirect(
			buildRedirectUrl(
				returnTo,
				'error',
				'Email send failed. Please try again.'
			)
		)
	}
}
