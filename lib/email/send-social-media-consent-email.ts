import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

type SendSocialMediaConsentArgs = {
	to: string[]
	subject: string
	html: string
	pdfBuffer: Buffer
}

export async function sendSocialMediaConsentEmail({
	to,
	subject,
	html,
	pdfBuffer,
}: SendSocialMediaConsentArgs) {
	if (to.length === 0) return

	await resend.emails.send({
		from: 'Burley FamilySearch Center <no-reply@burleyfamilysearchcenter.com>',
		to,
		subject,
		html,
		attachments: [
			{
				filename: 'social-media-consent.pdf',
				content: pdfBuffer.toString('base64'),
				contentType: 'application/pdf',
			},
		],
	})
}
