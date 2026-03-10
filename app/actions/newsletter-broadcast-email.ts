'use server'

import { and, eq, isNotNull, isNull } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { Buffer } from 'node:buffer'
import { db } from '@/db'
import { user } from '@/db/schema/tables/auth'
import {
	newsletterEmailSends,
	newsletterSubscribers,
} from '@/db/schema/tables/newsletters'
import { can } from '@/lib/permissions/can'
import { requirePermission } from '@/lib/permissions/require-permission'
import { sendEmail } from '@/lib/email/mailer'
import { renderNewsletterMonthlySchedulePdf } from '@/lib/pdf/newsletter-monthly-schedule'
import { getCenterTimeConfig } from '@/lib/time/center-time'
import { listCalendarPrintData } from '@/db/queries/calendar-print'
import { formatInTz, formatYmdMonth } from '@/utils/time'

const FROM_EMAIL =
	'Burley FamilySearch Center <no-reply@burleyfamilysearchcenter.com>'
const RECIPIENT_BATCH_SIZE = 45
const MAX_TOTAL_ATTACHMENT_BYTES = 7 * 1024 * 1024

type EncodedAttachment = {
	filename: string
	content: string
	contentType?: string
}

function escapeHtml(input: string) {
	return input
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;')
}

function sanitizeEmailHtml(raw: string) {
	const withoutScripts = raw
		.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
		.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
		.replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
		.replace(/\son\w+="[^"]*"/gi, '')
		.replace(/\son\w+='[^']*'/gi, '')
		.replace(/\shref="javascript:[^"]*"/gi, '')
		.replace(/\shref='javascript:[^']*'/gi, '')

	// Keep a conservative set of tags for broad email-client support.
	const onlyAllowedTags = withoutScripts.replace(
		/<(\/?)(?!p\b|br\b|strong\b|b\b|em\b|i\b|u\b|ul\b|ol\b|li\b|span\b)([a-z0-9-]+)([^>]*)>/gi,
		''
	)

	const withCleanInlineStyles = onlyAllowedTags.replace(
		/<(p|span)([^>]*)>/gi,
		(_, tag: string, attrs: string) => {
			const styleMatch =
				attrs.match(/\sstyle="([^"]*)"/i) ?? attrs.match(/\sstyle='([^']*)'/i)
			if (!styleMatch) return `<${tag}>`

			const safeStyle = styleMatch[1]
				.split(';')
				.map((value) => value.trim())
				.filter(Boolean)
				.filter((value) =>
					/^(text-align|font-weight|font-style|text-decoration)\s*:/i.test(
						value
					)
				)
				.join('; ')

			return safeStyle ? `<${tag} style="${safeStyle}">` : `<${tag}>`
		}
	)

	return withCleanInlineStyles
		.replace(/<(strong|b|em|i|u|ul|ol|li|br)\s+[^>]*>/gi, '<$1>')
		.trim()
}

function htmlHasVisibleText(raw: string) {
	const text = raw
		.replace(/<[^>]+>/g, ' ')
		.replace(/&nbsp;/gi, ' ')
		.trim()
	return text.length > 0
}

function toHtmlMessage(bodyHtml: string) {
	return `<div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6;">${bodyHtml}</div>`
}

async function buildMonthlyScheduleHtml(month: string) {
	const centerTime = await getCenterTimeConfig()
	const data = await listCalendarPrintData({
		month,
		centerTimeZone: centerTime.timeZone,
		includeClasses: true,
		includeReservations: false,
		classPresenter: null,
		classLocation: null,
		reservationResource: null,
		reservationStatuses: ['confirmed'],
		canViewUnconfirmedReservations: false,
	})

	const monthLabel = formatYmdMonth(month, 'en-US')
	const sections: string[] = []
	const byDate = new Map<string, string[]>()

	for (const event of data.classes) {
		const time = formatInTz(new Date(event.startsAtIso), centerTime.timeZone, 'h:mm a')
		const lineItems = [
			`<strong>${escapeHtml(time)} - ${escapeHtml(event.title)}${
				event.isCanceled ? ' (Canceled)' : ''
			}</strong>`,
			escapeHtml(event.location),
		]
		if (event.presenters.length > 0) {
			lineItems.push(`Presenters: ${escapeHtml(event.presenters.join(', '))}`)
		}
		if (event.description?.trim()) {
			lineItems.push(escapeHtml(event.description.trim()))
		}
		const item = `<li>${lineItems.join('<br />')}</li>`
		const rows = byDate.get(event.date) ?? []
		rows.push(item)
		byDate.set(event.date, rows)
	}

	for (const closure of data.closures) {
		const reason = closure.reason?.trim()
			? ` - ${escapeHtml(closure.reason.trim())}`
			: ''
		const item = `<li><strong>Closed</strong>${reason}</li>`
		const rows = byDate.get(closure.date) ?? []
		rows.push(item)
		byDate.set(closure.date, rows)
	}

	const orderedDates = Array.from(byDate.keys()).sort((a, b) => a.localeCompare(b))
	for (const ymd of orderedDates) {
		const [year, mon, day] = ymd.split('-').map(Number)
		const dateLabel = new Date(year, mon - 1, day).toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric',
		})
		sections.push(
			`<p><strong>${escapeHtml(dateLabel)}</strong></p><ul>${(
				byDate.get(ymd) ?? []
			).join('')}</ul>`
		)
	}

	if (sections.length === 0) {
		return `<p><strong>Class Schedule - ${escapeHtml(
			monthLabel
		)}</strong></p><p>No classes or closures found for this month.</p>`
	}

	return `<p><strong>Class Schedule - ${escapeHtml(
		monthLabel
	)}</strong></p>${sections.join('')}`
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
	detail: string,
	mode?: 'test' | 'full',
	recipient?: string
) {
	const safePath = returnTo.startsWith('/') ? returnTo : '/en/admin/newsletter'
	const url = new URL(safePath, 'http://localhost')
	url.searchParams.set('mailStatus', status)
	if (mode) {
		url.searchParams.set('mailMode', mode)
	}
	if (recipient) {
		url.searchParams.set('mailRecipient', recipient)
	}
	if (status === 'sent') {
		url.searchParams.set('mailCount', detail)
	} else {
		url.searchParams.set('mailError', detail)
	}
	return `${url.pathname}?${url.searchParams.toString()}`
}

async function getNewsletterAudienceEmails() {
	const [userRows, subscriberRows] = await Promise.all([
		db
			.select({ email: user.email })
			.from(user)
			.where(isNotNull(user.email)),
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

	return [
		...new Set(
			[...userRows, ...subscriberRows]
				.map((row) => row.email?.trim().toLowerCase() ?? '')
				.filter((email) => email.length > 0)
		),
	]
}

async function encodeAttachments(files: File[]) {
	const totalBytes = files.reduce((sum, file) => sum + file.size, 0)
	if (totalBytes > MAX_TOTAL_ATTACHMENT_BYTES) {
		throw new Error('Attachments exceed the 7MB upload limit.')
	}

	const encoded: EncodedAttachment[] = []
	for (const file of files) {
		const bytes = Buffer.from(await file.arrayBuffer())
		encoded.push({
			filename: file.name || 'attachment',
			content: bytes.toString('base64'),
			contentType: file.type || 'application/octet-stream',
		})
	}

	return encoded
}

export async function sendNewsletterBroadcastEmail(formData: FormData) {
	const locale = String(formData.get('locale') ?? 'en')
	const returnTo = String(
		formData.get('returnTo') ?? `/${locale}/admin/newsletter`
	)

	try {
		const actor = await requirePermission(
			locale,
			'newsletters.view',
			`/${locale}/admin/newsletter`
		)

		const actorRole = actor.role ?? 'Patron'
		const [canCreate, canUpdate] = await Promise.all([
			can(actor.id, actorRole, 'newsletters.create'),
			can(actor.id, actorRole, 'newsletters.update'),
		])

		if (!canCreate && !canUpdate) {
			redirect(
				buildRedirectUrl(
					returnTo,
					'error',
					'You are not allowed to send newsletter emails.'
				)
			)
		}

		const subject = String(formData.get('subject') ?? '').trim()
		const rawMessageHtml = String(formData.get('messageHtml') ?? '').trim()
		const sendMode = formData.get('sendMode') === 'test' ? 'test' : 'full'
		const selectedMonthRaw = String(formData.get('selectedMonth') ?? '').trim()
		const selectedMonth =
			/^\d{4}-\d{2}$/.test(selectedMonthRaw) ? selectedMonthRaw : null
		const files = formData
			.getAll('attachments')
			.filter((value): value is File => value instanceof File && value.size > 0)

		if (!subject) {
			redirect(buildRedirectUrl(returnTo, 'error', 'Subject is required.'))
		}
		const messageHtml = sanitizeEmailHtml(rawMessageHtml)
		if (!htmlHasVisibleText(messageHtml)) {
			redirect(buildRedirectUrl(returnTo, 'error', 'Message body is required.'))
		}

		const [allRecipients, attachments] = await Promise.all([
			getNewsletterAudienceEmails(),
			encodeAttachments(files),
		])
		const calendarAttachment = selectedMonth
			? await renderNewsletterMonthlySchedulePdf(selectedMonth)
			: null
		const scheduleHtmlSection = selectedMonth
			? await buildMonthlyScheduleHtml(selectedMonth)
			: ''
		const finalAttachments = calendarAttachment
			? [calendarAttachment, ...attachments]
			: attachments

		const recipients =
			sendMode === 'test'
				? actor.email
					? [actor.email.trim().toLowerCase()]
					: []
				: allRecipients

		if (recipients.length === 0) {
			redirect(
				buildRedirectUrl(
					returnTo,
					'error',
					'No newsletter recipients were found.'
				)
			)
		}

		const html = toHtmlMessage(
			`${messageHtml}${scheduleHtmlSection ? `<br /><br />${scheduleHtmlSection}` : ''}`
		)
		for (const batch of splitIntoBatches(recipients, RECIPIENT_BATCH_SIZE)) {
			await sendEmail({
				from: FROM_EMAIL,
				to: batch,
				subject,
				html,
				attachments: finalAttachments,
			})
		}

		await db.insert(newsletterEmailSends).values({
			senderUserId: actor.id,
			senderEmail: actor.email ?? 'unknown',
			sendMode,
			selectedMonth,
			subject,
			recipientCount: recipients.length,
			recipientEmailsSample: recipients.slice(0, 10),
			attachmentNames: finalAttachments.map((attachment) => attachment.filename),
		})

		redirect(
			buildRedirectUrl(
				returnTo,
				'sent',
				String(recipients.length),
				sendMode,
				sendMode === 'test' ? recipients[0] : undefined
			)
		)
	} catch (error) {
		const maybeRedirectDigest =
			typeof error === 'object' && error !== null && 'digest' in error
				? String((error as { digest?: unknown }).digest)
				: ''
		if (maybeRedirectDigest.startsWith('NEXT_REDIRECT')) throw error

		console.error('Failed to send newsletter broadcast email', error)
		const message =
			error instanceof Error
				? error.message
				: 'Email send failed. Please try again.'
		redirect(buildRedirectUrl(returnTo, 'error', message))
	}
}
