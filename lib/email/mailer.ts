// lib/email/mailer.ts
import { Resend } from 'resend'

type EmailAttachment = {
	filename: string
	content: string
	contentType?: string
}

type SendEmailArgs = {
	from: string
	to: string[]
	subject: string
	html: string
	attachments?: EmailAttachment[]
}

export type OutboxEmail = SendEmailArgs & {
	sentAt: string
}

const globalForMail = globalThis as typeof globalThis & {
	__mailOutbox?: OutboxEmail[]
}

const outbox = globalForMail.__mailOutbox ?? []
globalForMail.__mailOutbox = outbox

function shouldSendRealEmail() {
	if (process.env.FORCE_EMAIL_OUTBOX === '1') return false
	return Boolean(process.env.RESEND_API_KEY)
}

export function getEmailOutbox() {
	return outbox
}

export function clearEmailOutbox() {
	outbox.length = 0
}

export async function sendEmail({
	from,
	to,
	subject,
	html,
	attachments,
}: SendEmailArgs) {
	if (to.length === 0) return

	if (!shouldSendRealEmail()) {
		outbox.push({
			from,
			to,
			subject,
			html,
			attachments: (attachments ?? []).map((attachment) => ({
				...attachment,
				content: '[base64 omitted]',
			})),
			sentAt: new Date().toISOString(),
		})
		return
	}

	const resend = new Resend(process.env.RESEND_API_KEY)
	await resend.emails.send({
		from,
		to,
		subject,
		html,
		attachments,
	})
}
