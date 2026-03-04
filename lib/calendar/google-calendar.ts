import 'server-only'

import { fromZonedTime } from 'date-fns-tz'

type IcsField = {
	name: string
	params: Record<string, string>
	value: string
}

type RawGoogleEvent = {
	uid: string
	summary: string
	description: string | null
	location: string | null
	status: string | null
	start: Date | null
	end: Date | null
}

export type GoogleCalendarEvent = {
	id: string
	title: string
	description: string | null
	location: string
	startsAtIso: string
	endsAtIso: string
}

const DEFAULT_GOOGLE_CALENDAR_EMBED_URL =
	'https://calendar.google.com/calendar/embed?src=id_burley%40familyhistorymail.org&ctz=America%2FBoise'

function unfoldIcsLines(raw: string): string[] {
	const normalized = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
	const lines = normalized.split('\n')
	const unfolded: string[] = []
	for (const line of lines) {
		if (
			(line.startsWith(' ') || line.startsWith('\t')) &&
			unfolded.length > 0
		) {
			unfolded[unfolded.length - 1] += line.slice(1)
			continue
		}
		unfolded.push(line)
	}
	return unfolded
}

function unescapeIcsText(value: string): string {
	return value
		.replace(/\\n/gi, '\n')
		.replace(/\\,/g, ',')
		.replace(/\\;/g, ';')
		.replace(/\\\\/g, '\\')
}

function parseIcsField(line: string): IcsField | null {
	const separatorIndex = line.indexOf(':')
	if (separatorIndex <= 0) return null

	const rawKey = line.slice(0, separatorIndex)
	const value = line.slice(separatorIndex + 1)
	const [name, ...paramSegments] = rawKey.split(';')

	const params: Record<string, string> = {}
	for (const segment of paramSegments) {
		const [paramName, paramValue] = segment.split('=')
		if (!paramName || !paramValue) continue
		params[paramName.toUpperCase()] = paramValue
	}

	return {
		name: name.toUpperCase(),
		params,
		value,
	}
}

function parseIcsDate(
	value: string,
	params: Record<string, string>,
	fallbackTimeZone: string
): Date | null {
	const valueType = params.VALUE?.toUpperCase()
	if (valueType === 'DATE' || /^\d{8}$/.test(value)) {
		const year = Number(value.slice(0, 4))
		const month = Number(value.slice(4, 6))
		const day = Number(value.slice(6, 8))
		if (
			!Number.isFinite(year) ||
			!Number.isFinite(month) ||
			!Number.isFinite(day)
		) {
			return null
		}
		return fromZonedTime(
			new Date(year, month - 1, day, 0, 0, 0, 0),
			params.TZID || fallbackTimeZone
		)
	}

	const match = value.match(
		/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/
	)
	if (!match) return null

	const [, y, m, d, hh, mm, ss, z] = match
	const year = Number(y)
	const month = Number(m)
	const day = Number(d)
	const hour = Number(hh)
	const minute = Number(mm)
	const second = Number(ss)

	if (z === 'Z') {
		return new Date(Date.UTC(year, month - 1, day, hour, minute, second, 0))
	}

	return fromZonedTime(
		new Date(year, month - 1, day, hour, minute, second, 0),
		params.TZID || fallbackTimeZone
	)
}

function parseGoogleCalendarIcs(
	rawIcs: string,
	fallbackTimeZone: string
): RawGoogleEvent[] {
	const lines = unfoldIcsLines(rawIcs)
	const events: RawGoogleEvent[] = []
	let current: RawGoogleEvent | null = null

	for (const line of lines) {
		if (line === 'BEGIN:VEVENT') {
			current = {
				uid: '',
				summary: '',
				description: null,
				location: null,
				status: null,
				start: null,
				end: null,
			}
			continue
		}

		if (line === 'END:VEVENT') {
			if (current && current.uid && current.summary && current.start) {
				events.push(current)
			}
			current = null
			continue
		}

		if (!current) continue

		const field = parseIcsField(line)
		if (!field) continue

		if (field.name === 'UID') {
			current.uid = field.value.trim()
		} else if (field.name === 'SUMMARY') {
			current.summary = unescapeIcsText(field.value.trim())
		} else if (field.name === 'DESCRIPTION') {
			current.description = unescapeIcsText(field.value.trim()) || null
		} else if (field.name === 'LOCATION') {
			current.location = unescapeIcsText(field.value.trim()) || null
		} else if (field.name === 'STATUS') {
			current.status = field.value.trim().toUpperCase()
		} else if (field.name === 'DTSTART') {
			current.start = parseIcsDate(field.value.trim(), field.params, fallbackTimeZone)
		} else if (field.name === 'DTEND') {
			current.end = parseIcsDate(field.value.trim(), field.params, fallbackTimeZone)
		}
	}

	return events
}

function deriveIcsUrlFromEmbed(embedUrl: string): string | null {
	try {
		const parsed = new URL(embedUrl)
		const src = parsed.searchParams.get('src')
		if (!src) return null
		const calendarId = decodeURIComponent(src)
		return `https://calendar.google.com/calendar/ical/${encodeURIComponent(calendarId)}/public/basic.ics`
	} catch {
		return null
	}
}

function getGoogleCalendarEmbedUrl(): string {
	return (
		process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_EMBED_URL ||
		DEFAULT_GOOGLE_CALENDAR_EMBED_URL
	)
}

function getGoogleCalendarIcsUrl(): string | null {
	if (process.env.GOOGLE_CALENDAR_ICS_URL) {
		return process.env.GOOGLE_CALENDAR_ICS_URL
	}
	return deriveIcsUrlFromEmbed(getGoogleCalendarEmbedUrl())
}

function overlapsRange(
	start: Date,
	end: Date,
	rangeStart: Date,
	rangeEnd: Date
): boolean {
	return start <= rangeEnd && end >= rangeStart
}

export async function listGoogleCalendarEvents(args: {
	rangeStart: Date
	rangeEnd: Date
	centerTimeZone: string
}): Promise<GoogleCalendarEvent[]> {
	const icsUrl = getGoogleCalendarIcsUrl()
	if (!icsUrl) return []

	try {
		const response = await fetch(icsUrl, {
			next: { revalidate: 300 },
			headers: {
				accept: 'text/calendar,text/plain;q=0.9,*/*;q=0.8',
			},
		})
		if (!response.ok) return []

		const rawIcs = await response.text()
		const rawEvents = parseGoogleCalendarIcs(rawIcs, args.centerTimeZone)

		return rawEvents
			.filter((event) => event.status !== 'CANCELLED')
			.map((event) => {
				const start = event.start
				const end = event.end ?? event.start
				if (!start || !end) return null
				return {
					id: event.uid,
					title: event.summary,
					description: event.description,
					location: event.location || 'Google Calendar',
					startsAtIso: start.toISOString(),
					endsAtIso: end.toISOString(),
				}
			})
			.filter((event): event is GoogleCalendarEvent => Boolean(event))
			.filter((event) =>
				overlapsRange(
					new Date(event.startsAtIso),
					new Date(event.endsAtIso),
					args.rangeStart,
					args.rangeEnd
				)
			)
			.sort((a, b) => a.startsAtIso.localeCompare(b.startsAtIso))
	} catch {
		return []
	}
}
