import { sendEmail } from './mailer'

type SendSubstituteNotificationEmailArgs = {
	to: string
	subject: string
	html: string
}

export async function sendSubstituteNotificationEmail({
	to,
	subject,
	html,
}: SendSubstituteNotificationEmailArgs) {
	if (!to) return

	await sendEmail({
		from: 'Burley FamilySearch Center <no-reply@burleyfamilysearchcenter.com>',
		to: [to],
		subject,
		html,
	})
}
