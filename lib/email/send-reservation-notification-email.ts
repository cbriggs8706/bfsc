// lib/email/send-reservation-notification-email.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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

	await resend.emails.send({
		from: 'Burley FamilySearch Center <no-reply@burleyfamilysearchcenter.com>',
		to,
		subject,
		html,
	})
}
