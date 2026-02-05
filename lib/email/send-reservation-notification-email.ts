// lib/email/send-reservation-notification-email.ts
import { sendEmail } from './mailer'

type SendReservationNotificationArgs = {
	to: string[]
	subject: string
	html: string
}

export async function sendReservationNotificationEmail({
	to,
	subject,
	html,
}: SendReservationNotificationArgs) {
	if (to.length === 0) return

	await sendEmail({
		from: 'Burley FamilySearch Center <no-reply@burleyfamilysearchcenter.com>',
		to,
		subject,
		html,
	})
}
