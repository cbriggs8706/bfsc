import { Resend } from 'resend'
import { getTranslations } from 'next-intl/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendPasswordResetEmail({
	email,
	resetUrl,
	locale,
}: {
	email: string
	resetUrl: string
	locale: string
}) {
	const t = await getTranslations({
		locale,
		namespace: 'emails.passwordReset',
	})

	await resend.emails.send({
		from: 'Burley FamilySearch Center <no-reply@burleyfamilysearchcenter.com>',
		to: email,
		subject: t('subject'),
		html: `
			<div style="font-family: system-ui, sans-serif; line-height: 1.6">
				<h2>${t('title')}</h2>

				<p>${t('intro')}</p>

				<p style="margin: 24px 0">
					<a
						href="${resetUrl}"
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
						${t('button')}
					</a>
				</p>

				<p style="font-size: 14px; color: #6b7280">
					${t('footer')}
				</p>
			</div>
		`,
	})
}
