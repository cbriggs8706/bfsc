// lib/email/send-newsletter-confirmation-email.ts
import { sendEmail } from './mailer'

export async function sendNewsletterConfirmationEmail(
	email: string,
	token: string,
	locale: string = 'en'
) {
	const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/newsletter/confirm?token=${token}`

	await sendEmail({
		from: 'Burley FamilySearch Center <no-reply@burleyfamilysearchcenter.com>',
		to: [email],
		subject: 'Confirm your newsletter subscription',
		html: `
			<div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.5;">
				<h2>Confirm your subscription</h2>

				<p>
					Thanks for signing up for the Burley FamilySearch Center monthly newsletter.
				</p>

				<p>
					Please confirm your email address by clicking the button below:
				</p>

				<p style="margin: 24px 0;">
					<a
						href="${confirmUrl}"
						style="
							display: inline-block;
							padding: 12px 20px;
							background-color: #111827;
							color: #ffffff;
							text-decoration: none;
							border-radius: 6px;
							font-weight: 500;
						"
					>
						Confirm Subscription
					</a>
				</p>

				<p style="font-size: 14px; color: #6b7280;">
					If you did not request this, you can safely ignore this email.
				</p>
			</div>
		`,
	})
}
