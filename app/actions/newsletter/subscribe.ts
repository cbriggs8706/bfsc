// app/actions/newsletter/subscribe.ts
'use server'

import { db } from '@/db'
import { newsletterSubscribers } from '@/db'
import { sendNewsletterConfirmationEmail } from '@/lib/email/send-newsletter-confirmation-email'
import { randomUUID } from 'crypto'
import { eq } from 'drizzle-orm'

export type SubscribeResult =
	| { status: 'ok' }
	| { status: 'already-confirmed' }
	| { status: 'error'; message: string }

export async function subscribeToNewsletter(
	emailRaw: string
): Promise<SubscribeResult> {
	const email = emailRaw.trim().toLowerCase()

	if (!email.includes('@')) {
		return { status: 'error', message: 'Please enter a valid email address.' }
	}

	const token = randomUUID()

	const existing = await db.query.newsletterSubscribers.findFirst({
		where: eq(newsletterSubscribers.email, email),
	})

	if (existing?.isConfirmed) {
		return { status: 'already-confirmed' }
	}

	if (existing) {
		await db
			.update(newsletterSubscribers)
			.set({ confirmToken: token })
			.where(eq(newsletterSubscribers.id, existing.id))
	} else {
		await db.insert(newsletterSubscribers).values({
			email,
			confirmToken: token,
			source: 'homepage',
		})
	}

	// TODO: send confirmation email
	await sendNewsletterConfirmationEmail(email, token)

	return { status: 'ok' }
}
