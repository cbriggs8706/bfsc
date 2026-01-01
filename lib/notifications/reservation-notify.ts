// lib/notifications/reservation-notify.ts
import { getReservationNotificationContext } from '@/db/queries/reservation-notifications'
import { sendReservationNotificationEmail } from '@/lib/email/send-reservation-notification-email'
import { db, reservations } from '@/db'
import { eq } from 'drizzle-orm'
import { format } from 'date-fns'

const DEBUG_NOTIFY = process.env.NODE_ENV !== 'production'
const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export async function notifyReservationChanged(args: {
	reservationId: string
	mode: 'create' | 'update'
}) {
	const ctx = await getReservationNotificationContext(args.reservationId)
	if (!ctx) return
	const adminReservationUrl = `${APP_BASE_URL}/${ctx.locale}/admin/reservation`
	const roleOrder = ['Director', 'Assistant Director', 'Shift Leader']

	DEBUG_NOTIFY &&
		console.log('[notify] context:', {
			reservationId: ctx.reservationId,
			submitterEmail: ctx.submitterEmail,
			staffRecipients: ctx.staffRecipients,
			resourceName: ctx.resourceName,
			wardName: ctx.wardName,
			stakeName: ctx.stakeName,
			faithName: ctx.faithName,
		})

	// Pull the full reservation details for the email body
	const r = await db.query.reservations.findFirst({
		where: eq(reservations.id, args.reservationId),
		columns: {
			startTime: true,
			endTime: true,
			attendeeCount: true,
			assistanceLevel: true,
			phone: true,
			notes: true,
			status: true,
		},
	})
	if (!r) return

	type ReservationStatus = 'pending' | 'confirmed' | 'denied' | 'cancelled'

	const statusCopy: Record<
		ReservationStatus,
		{
			staffSubject: string
			submitterSubject: string
			staffHeading: string
			submitterHeading: string
			description: string
		}
	> = {
		pending: {
			staffSubject: `Action required: New reservation – ${
				ctx.resourceName ?? 'Resource'
			}`,
			submitterSubject: `Reservation received: ${
				ctx.resourceName ?? 'Resource'
			}`,
			staffHeading: 'New Reservation',
			submitterHeading: 'Your reservation was received',
			description: 'This reservation is awaiting review.',
		},
		confirmed: {
			staffSubject: `Reservation confirmed – ${ctx.resourceName ?? 'Resource'}`,
			submitterSubject: `Reservation confirmed: ${
				ctx.resourceName ?? 'Resource'
			}`,
			staffHeading: 'Reservation Confirmed',
			submitterHeading: 'Your reservation is confirmed',
			description: 'This reservation has been approved by staff.',
		},
		denied: {
			staffSubject: `Reservation denied – ${ctx.resourceName ?? 'Resource'}`,
			submitterSubject: `Reservation update: ${ctx.resourceName ?? 'Resource'}`,
			staffHeading: 'Reservation Denied',
			submitterHeading: 'Your reservation was not approved',
			description: 'This reservation has been denied.',
		},
		cancelled: {
			staffSubject: `Reservation cancelled – ${ctx.resourceName ?? 'Resource'}`,
			submitterSubject: `Reservation cancelled: ${
				ctx.resourceName ?? 'Resource'
			}`,
			staffHeading: 'Reservation Cancelled',
			submitterHeading: 'Your reservation was cancelled',
			description: 'This reservation has been cancelled.',
		},
	}

	const status: ReservationStatus =
		r.status && r.status in statusCopy
			? (r.status as ReservationStatus)
			: 'pending'
	const statusColor = {
		pending: '#f59e0b',
		confirmed: '#16a34a',
		denied: '#dc2626',
		cancelled: '#6b7280',
	}[status]

	const copy = statusCopy[status]
	const showActionButtons = status === 'pending'

	const staffEmails = Array.from(
		new Set(ctx.staffRecipients.map((s) => s.email))
	)
	const orderedStaff = [...ctx.staffRecipients].sort(
		(a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role)
	)

	const submitterRecipient = ctx.submitterEmail ? [ctx.submitterEmail] : []

	DEBUG_NOTIFY && console.log('[notify] FINAL RECIPIENTS:', staffEmails)

	const when = `${format(new Date(r.startTime), 'PPPP p')} – ${format(
		new Date(r.endTime),
		'p'
	)}`

	const subjectPrefix = DEBUG_NOTIFY ? '[DEV] ' : ''

	const staffSubject = subjectPrefix + copy.staffSubject
	const submitterSubject = subjectPrefix + copy.submitterSubject

	const staffNotesSection =
		r.notes && status !== 'pending'
			? `
	<tr>
		<td style="color:#6b7280; vertical-align: top;">Staff notes</td>
		<td>${escapeHtml(r.notes)}</td>
	</tr>`
			: ''

	const telHref = r.phone?.replace(/[^\d+]/g, '')

	const callButton = r.phone
		? `
		<a
			href="tel:${telHref}"
			style="
				display: inline-block;
				padding: 10px 14px;
				background: #16a34a;
				color: white;
				text-decoration: none;
				border-radius: 6px;
				font-weight: 600;
				margin-right: 10px;
			"
		>
			📞 Call submitter
		</a>
	`
		: ''

	const adminButton = `
	<a
		href="${adminReservationUrl}"
		style="
			display: inline-block;
			padding: 10px 14px;
			background: #2563eb;
			color: white;
			text-decoration: none;
			border-radius: 6px;
			font-weight: 600;
		"
	>
		🔐 Log in to confirm this reservation
	</a>
`

	const staffHtml = `
<div style="font-family: system-ui, sans-serif; line-height: 1.5;">
	<h2 style="color:${statusColor}">${copy.staffHeading}</h2>
<p>${copy.description}</p>


	<div style="margin: 16px 0;">
		${showActionButtons ? callButton : ''}
${showActionButtons ? adminButton : ''}

	</div>

	<hr style="margin: 20px 0;" />

	<table style="border-collapse: collapse; width: 100%; max-width: 640px;">
		<tr><td style="color:#6b7280;">Resource</td><td><strong>${
			ctx.resourceName ?? ''
		}</strong></td></tr>
		<tr><td style="color:#6b7280;">When</td><td>${when}</td></tr>
		<tr><td style="color:#6b7280;">Attendees</td><td>${
			r.attendeeCount ?? ''
		}</td></tr>
		<tr><td style="color:#6b7280;">Assistance</td><td>${
			r.assistanceLevel ?? ''
		}</td></tr>
		<tr><td style="color:#6b7280;">Phone</td><td>${r.phone ?? ''}</td></tr>
		${
			ctx.wardName
				? `<tr><td style="color:#6b7280;">Ward</td><td>${ctx.wardName}${
						ctx.stakeName ? ` (${ctx.stakeName} Stake)` : ''
				  }</td></tr>`
				: ctx.faithName
				? `<tr><td style="color:#6b7280;">Faith</td><td>${ctx.faithName}</td></tr>`
				: ''
		}
		${staffNotesSection}

	</table>

	<p style="margin-top: 18px; font-size: 13px; color: #6b7280;">
		This is an automated internal notification.
	</p>
</div>
`

	const submitterHtml = `
<div style="font-family: system-ui, sans-serif; line-height: 1.5;">
	<h2 style="color:${statusColor}">${copy.submitterHeading}</h2>
<p>${copy.description}</p>


	<table style="border-collapse: collapse; width: 100%; max-width: 640px;">
		<tr><td style="color:#6b7280;">Resource</td><td><strong>${
			ctx.resourceName ?? ''
		}</strong></td></tr>
		<tr><td style="color:#6b7280;">When</td><td>${when}</td></tr>
		<tr><td style="color:#6b7280;">Attendees</td><td>${
			r.attendeeCount ?? ''
		}</td></tr>
		${staffNotesSection}

	</table>

	<p style="margin-top: 16px;">
		This notification was also sent to:
	</p>

<ul>
	${orderedStaff
		.map(
			(s) =>
				`<li>${escapeHtml(s.name ?? 'Unknown')} – ${s.role} – ${s.email}</li>`
		)
		.join('')}
</ul>



	<p style="font-size: 13px; color: #6b7280;">
		You do not need to take any further action unless contacted by staff.
	</p>
</div>
`

	if (staffEmails.length === 0) {
		console.error(
			'[notify] ABORTING — no recipients resolved for reservation',
			args.reservationId
		)
		return
	}

	DEBUG_NOTIFY &&
		console.log('[notify] sending email', {
			to: staffEmails,
			subject: staffSubject,
			mode: args.mode,
		})

	if (staffEmails.length > 0) {
		await sendReservationNotificationEmail({
			to: staffEmails,
			subject: staffSubject,
			html: staffHtml,
		})
	}

	if (submitterRecipient.length > 0) {
		await sendReservationNotificationEmail({
			to: submitterRecipient,
			subject: submitterSubject,
			html: submitterHtml,
		})
	}
}

function escapeHtml(input: string) {
	return input
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#039;')
}
