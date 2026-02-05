import { NextResponse } from 'next/server'
import * as z from 'zod'
import { renderSocialMediaConsentPdf } from '@/lib/pdf/social-media-consent'
import { sendSocialMediaConsentEmail } from '@/lib/email/send-social-media-consent-email'
import { getDirectorRecipients } from '@/db/queries/director-recipients'

export const runtime = 'nodejs'

const additionalGrantorSchema = z.object({
	name: z.string().optional(),
	phone: z.string().optional(),
	address: z.string().optional(),
	signature: z.string().optional(),
	date: z.string().optional(),
	parentName: z.string().optional(),
	parentPhone: z.string().optional(),
	parentAddress: z.string().optional(),
	parentSignature: z.string().optional(),
	parentDate: z.string().optional(),
})

const schema = z
	.object({
	projectGrantor: z.string().min(1),
	ipoNumber: z.string().optional(),
	fileNumber: z.string().optional(),

	grantorName: z.string().min(1),
	grantorPhone: z.string().min(7),
	grantorAddress: z.string().min(5),
	photographerName: z.string().optional(),
	description: z.string().min(5),

	isMinor: z.boolean().default(false),
	parentName: z.string().optional(),
	parentPhone: z.string().optional(),
	parentAddress: z.string().optional(),
	parentSignature: z.string().optional(),
	parentDate: z.string().optional(),

	grantorSignature: z.string().min(1),
	grantorDate: z.string().min(1),

	additionalGrantors: z.array(additionalGrantorSchema).default([]),
	consentConfirmed: z.boolean().refine(Boolean),
	})
	.superRefine((values, ctx) => {
		if (values.isMinor) {
			if (!values.parentName) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Parent/guardian name required',
					path: ['parentName'],
				})
			}
			if (!values.parentSignature) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Parent/guardian signature required',
					path: ['parentSignature'],
				})
			}
			if (!values.parentDate) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Parent/guardian date required',
					path: ['parentDate'],
				})
			}
		}
	})

export async function POST(request: Request) {
	try {
		const json = await request.json()
		const data = schema.parse(json)

		const pdfBuffer = await renderSocialMediaConsentPdf(data)
		const directors = await getDirectorRecipients()
		const to = directors.map((d) => d.email)

		await sendSocialMediaConsentEmail({
			to,
			subject: `Photo consent form: ${data.grantorName}`,
			html: `
				<p>A new social media consent form has been submitted.</p>
				<ul>
					<li><strong>Grantor:</strong> ${data.grantorName}</li>
					<li><strong>Phone:</strong> ${data.grantorPhone}</li>
					<li><strong>Photographer:</strong> ${data.photographerName || '-'}</li>
				</ul>
				<p>The signed PDF is attached.</p>
			`,
			pdfBuffer,
		})

		return NextResponse.json({ ok: true })
	} catch (error) {
		console.error('[social-media-consent] error', error)
		return NextResponse.json(
			{ error: 'Unable to submit consent form' },
			{ status: 400 }
		)
	}
}
