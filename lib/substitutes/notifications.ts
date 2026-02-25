import { eq } from 'drizzle-orm'

import { db, center, kioskPeople, notifications, user } from '@/db'
import { NotificationType } from '@/types/substitutes'
import { formatYmdLong, toAmPm } from '@/utils/time'
import { sendSubstituteNotificationEmail } from '@/lib/email/send-substitute-notification-email'

type SupportedLocale = 'en' | 'es' | 'pt'

type SubstituteNotifyEvent =
	| {
			type: 'assignment'
			requestId: string
			date: string
			startTime: string
			endTime: string
	  }
	| {
			type: 'accepted'
			requestId: string
			date: string
			startTime: string
			endTime: string
	  }
	| {
			type: 'volunteered'
			requestId: string
			actorName: string
			date: string
			startTime: string
			endTime: string
	  }
	| {
			type: 'reopened'
			requestId: string
			actorName: string
			date: string
			startTime: string
			endTime: string
	  }
	| {
			type: 'declined'
			requestId: string
			actorName: string
			date: string
			startTime: string
			endTime: string
	  }
	| {
			type: 'expired'
			requestId: string
			date: string
			startTime: string
			endTime: string
	  }

function normalizeLocale(input: string | null | undefined): SupportedLocale {
	const value = (input ?? '').toLowerCase().trim()

	if (value.startsWith('es') || value.includes('span')) return 'es'
	if (value.startsWith('pt') || value.includes('portug')) return 'pt'
	return 'en'
}

function resolveLocaleFromLanguages(
	languages: string[] | null | undefined,
	fallbackLocale: SupportedLocale
): SupportedLocale {
	if (!languages || languages.length === 0) return fallbackLocale

	for (const raw of languages) {
		const candidate = normalizeLocale(raw)
		if (candidate === 'es' || candidate === 'pt') return candidate
	}

	return fallbackLocale
}

function mapEventTypeToNotificationType(
	eventType: SubstituteNotifyEvent['type']
): NotificationType {
	switch (eventType) {
		case 'assignment':
			return 'sub_request_assignment'
		case 'accepted':
			return 'sub_request_accepted'
		case 'volunteered':
			return 'sub_request_volunteered'
		case 'reopened':
			return 'sub_request_reopened'
		case 'declined':
			return 'sub_request_cancelled'
		case 'expired':
			return 'sub_request_expired'
	}
}

function formatShiftStamp(event: SubstituteNotifyEvent, locale: SupportedLocale) {
	const day = formatYmdLong(event.date, locale)
	const start = toAmPm(event.startTime, locale)
	const end = toAmPm(event.endTime, locale)
	return `${day} · ${start}-${end}`
}

function localizedCopy(locale: SupportedLocale, event: SubstituteNotifyEvent) {
	const when = formatShiftStamp(event, locale)

	if (locale === 'es') {
		switch (event.type) {
			case 'assignment':
				return {
					notification: `Te solicitaron cubrir un turno (${when}).`,
					subject: `Solicitud de sustitución: ${when}`,
					title: 'Nueva solicitud de sustitución',
					body: `Te pidieron cubrir este turno: ${when}.`,
				}
			case 'accepted':
				return {
					notification: `Aceptaron tu oferta de sustitución (${when}).`,
					subject: `Oferta de sustitución aceptada: ${when}`,
					title: 'Tu oferta fue aceptada',
					body: `Tu oferta para cubrir este turno fue aceptada: ${when}.`,
				}
			case 'volunteered':
				return {
					notification: `${event.actorName} se ofreció para cubrir tu turno (${when}).`,
					subject: `Nuevo voluntario para tu turno: ${when}`,
					title: 'Nuevo voluntario',
					body: `${event.actorName} se ofreció para cubrir tu turno: ${when}.`,
				}
			case 'reopened':
				return {
					notification: `${event.actorName} ya no cubrirá el turno (${when}). Se volvió a abrir.`,
					subject: `Solicitud reabierta: ${when}`,
					title: 'Solicitud reabierta',
					body: `${event.actorName} se retiró. Tu solicitud quedó abierta otra vez: ${when}.`,
				}
			case 'declined':
				return {
					notification: `${event.actorName} rechazó tu solicitud de sustitución (${when}).`,
					subject: `Solicitud rechazada: ${when}`,
					title: 'Solicitud rechazada',
					body: `${event.actorName} rechazó tu solicitud para este turno: ${when}.`,
				}
			case 'expired':
				return {
					notification: `Tu solicitud de sustitución venció (${when}).`,
					subject: `Solicitud vencida: ${when}`,
					title: 'Solicitud vencida',
					body: `Tu solicitud de sustitución venció para este turno: ${when}.`,
				}
		}
	}

	if (locale === 'pt') {
		switch (event.type) {
			case 'assignment':
				return {
					notification: `Você foi solicitado para cobrir um turno (${when}).`,
					subject: `Solicitação de substituição: ${when}`,
					title: 'Nova solicitação de substituição',
					body: `Pediram para você cobrir este turno: ${when}.`,
				}
			case 'accepted':
				return {
					notification: `Sua oferta de substituição foi aceita (${when}).`,
					subject: `Oferta de substituição aceita: ${when}`,
					title: 'Sua oferta foi aceita',
					body: `Sua oferta para cobrir este turno foi aceita: ${when}.`,
				}
			case 'volunteered':
				return {
					notification: `${event.actorName} se voluntariou para cobrir seu turno (${when}).`,
					subject: `Novo voluntário para seu turno: ${when}`,
					title: 'Novo voluntário',
					body: `${event.actorName} se voluntariou para cobrir seu turno: ${when}.`,
				}
			case 'reopened':
				return {
					notification: `${event.actorName} retirou a cobertura do turno (${when}). A solicitação foi reaberta.`,
					subject: `Solicitação reaberta: ${when}`,
					title: 'Solicitação reaberta',
					body: `${event.actorName} retirou a cobertura. Sua solicitação foi reaberta: ${when}.`,
				}
			case 'declined':
				return {
					notification: `${event.actorName} recusou sua solicitação de substituição (${when}).`,
					subject: `Solicitação recusada: ${when}`,
					title: 'Solicitação recusada',
					body: `${event.actorName} recusou sua solicitação para este turno: ${when}.`,
				}
			case 'expired':
				return {
					notification: `Sua solicitação de substituição expirou (${when}).`,
					subject: `Solicitação expirada: ${when}`,
					title: 'Solicitação expirada',
					body: `Sua solicitação de substituição expirou para este turno: ${when}.`,
				}
		}
	}

	switch (event.type) {
		case 'assignment':
			return {
				notification: `You were requested to cover a shift (${when}).`,
				subject: `Substitute request: ${when}`,
				title: 'New substitute request',
				body: `You were asked to cover this shift: ${when}.`,
			}
		case 'accepted':
			return {
				notification: `Your substitute offer was accepted (${when}).`,
				subject: `Substitute offer accepted: ${when}`,
				title: 'Your offer was accepted',
				body: `Your offer to cover this shift was accepted: ${when}.`,
			}
		case 'volunteered':
			return {
				notification: `${event.actorName} volunteered to cover your shift (${when}).`,
				subject: `New volunteer for your shift: ${when}`,
				title: 'New volunteer',
				body: `${event.actorName} volunteered to cover your shift: ${when}.`,
			}
		case 'reopened':
			return {
				notification: `${event.actorName} withdrew from covering your shift (${when}). Request reopened.`,
				subject: `Request reopened: ${when}`,
				title: 'Request reopened',
				body: `${event.actorName} withdrew coverage. Your request is open again: ${when}.`,
			}
		case 'declined':
			return {
				notification: `${event.actorName} declined your substitute request (${when}).`,
				subject: `Request declined: ${when}`,
				title: 'Request declined',
				body: `${event.actorName} declined your substitute request for this shift: ${when}.`,
			}
		case 'expired':
			return {
				notification: `Your substitute request expired (${when}).`,
				subject: `Request expired: ${when}`,
				title: 'Request expired',
				body: `Your substitute request expired for this shift: ${when}.`,
			}
	}
}

function getEmailCtaLabel(locale: SupportedLocale) {
	if (locale === 'es') return 'Ver solicitud'
	if (locale === 'pt') return 'Ver solicitação'
	return 'View request'
}

function getAutomatedFooter(locale: SupportedLocale, generatedAt: string) {
	if (locale === 'es') {
		return `Notificación automática enviada el ${generatedAt}.`
	}
	if (locale === 'pt') {
		return `Notificação automática enviada em ${generatedAt}.`
	}
	return `Automated notification sent at ${generatedAt}.`
}

export async function notifySubstituteEvent(
	recipientUserId: string,
	event: SubstituteNotifyEvent
) {
	const fallbackLocaleRow = await db
		.select({ primaryLanguage: center.primaryLanguage })
		.from(center)
		.where(eq(center.id, 1))
		.then((rows) => rows[0])

	const fallbackLocale = normalizeLocale(fallbackLocaleRow?.primaryLanguage)

	const recipient = await db
		.select({
			email: user.email,
			languages: kioskPeople.languagesSpoken,
		})
		.from(user)
		.leftJoin(kioskPeople, eq(kioskPeople.userId, user.id))
		.where(eq(user.id, recipientUserId))
		.then((rows) => rows[0])

	if (!recipient) return

	const locale = resolveLocaleFromLanguages(recipient.languages, fallbackLocale)
	const copy = localizedCopy(locale, event)
	const type = mapEventTypeToNotificationType(event.type)

	await db.insert(notifications).values({
		userId: recipientUserId,
		type,
		message: copy.notification,
	})

	if (!recipient.email) return

	const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
	const requestUrl = `${appBaseUrl}/${locale}/substitutes/request/${event.requestId}`
	const generatedAt = new Intl.DateTimeFormat(locale, {
		dateStyle: 'medium',
		timeStyle: 'short',
	}).format(new Date())

	const html = `
<div style="font-family: system-ui, sans-serif; line-height: 1.5;">
	<h2>${copy.title}</h2>
	<p>${copy.body}</p>
	<p>
		<a href="${requestUrl}" style="display:inline-block;padding:10px 14px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">
			${getEmailCtaLabel(locale)}
		</a>
	</p>
	<p style="font-size:13px;color:#6b7280;">${getAutomatedFooter(
		locale,
		generatedAt
	)}</p>
</div>`

	try {
		await sendSubstituteNotificationEmail({
			to: recipient.email,
			subject: copy.subject,
			html,
		})
	} catch (error) {
		console.error('Failed to send substitute notification email', error)
	}
}
