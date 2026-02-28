const REQUEST_TIMEOUT_MS = 8000
const MAX_ATTEMPTS = 2

export type GenieGreenieMicroskillStatus =
	| 'not_started'
	| 'in_progress'
	| 'active'
	| 'renewal_required'

export type GenieGreenieCertificateStatus = 'active' | 'renewal_required'

export type GenieGreeniePartnerCertificate = {
	microskillSlug: string
	microskillTitle: string
	badgeIcon: string
	continueUrl: string
	dateEarned: string
	earnedVersion: number
	currentVersion: number
	status: GenieGreenieCertificateStatus
}

export type GenieGreenieCertificatesLookupResponse = {
	email: string
	certificates: GenieGreeniePartnerCertificate[]
}

export type GenieGreenieMicroskillProgress = {
	microskillId: number
	microskillSlug: string
	microskillTitle: string
	badgeIcon: string
	continueUrl: string
	dateEarned: string | null
	earnedVersion: number | null
	currentVersion: number
	status: GenieGreenieMicroskillStatus
	requiredCompleted: number
	requiredTotal: number
	percent: number
}

export type GenieGreenieLookupWithProgressResponse = {
	email: string
	statuses: GenieGreenieMicroskillProgress[]
}

export class GenieGreenieClientError extends Error {
	public readonly code:
		| 'CONFIG'
		| 'BAD_REQUEST'
		| 'UNAUTHORIZED'
		| 'UPSTREAM'
		| 'NETWORK'
		| 'TIMEOUT'
		| 'INVALID_RESPONSE'
	public readonly status?: number

	constructor(
		message: string,
		code: GenieGreenieClientError['code'],
		status?: number,
		options?: { cause?: unknown }
	) {
		super(message, options)
		this.name = 'GenieGreenieClientError'
		this.code = code
		this.status = status
	}
}

function getConfig() {
	if (typeof window !== 'undefined') {
		throw new GenieGreenieClientError(
			'Genie Greenie client is server-only',
			'CONFIG'
		)
	}

	const baseUrl = process.env.GENIE_GREENIE_API_BASE_URL?.trim()
	const apiKey = process.env.GENIE_GREENIE_PARTNER_API_KEY?.trim()

	if (!baseUrl) {
		throw new GenieGreenieClientError(
			'Missing GENIE_GREENIE_API_BASE_URL',
			'CONFIG'
		)
	}

	if (!apiKey) {
		throw new GenieGreenieClientError(
			'Missing GENIE_GREENIE_PARTNER_API_KEY',
			'CONFIG'
		)
	}

	return {
		baseUrl: baseUrl.replace(/\/+$/, ''),
		apiKey,
	}
}

function isTransientStatus(status: number) {
	return status === 429 || status === 502 || status === 503 || status === 504
}

function normalizeNetworkError(error: unknown): GenieGreenieClientError {
	const message = error instanceof Error ? error.message : String(error)
	const lowered = message.toLowerCase()

	if (lowered.includes('abort') || lowered.includes('timeout')) {
		return new GenieGreenieClientError(
			'Genie Greenie request timed out',
			'TIMEOUT',
			undefined,
			{ cause: error }
		)
	}

	return new GenieGreenieClientError(
		'Network failure while contacting Genie Greenie',
		'NETWORK',
		undefined,
		{ cause: error }
	)
}

async function fetchWithRetry(
	path: string,
	init: Omit<RequestInit, 'signal'>
): Promise<Response> {
	const { baseUrl, apiKey } = getConfig()

	let attempt = 0

	while (attempt < MAX_ATTEMPTS) {
		const controller = new AbortController()
		const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

		try {
			const response = await fetch(`${baseUrl}${path}`, {
				...init,
				headers: {
					...init.headers,
					'Content-Type': 'application/json',
					'x-api-key': apiKey,
				},
				cache: 'no-store',
				signal: controller.signal,
			})

			clearTimeout(timeout)

			if (isTransientStatus(response.status) && attempt + 1 < MAX_ATTEMPTS) {
				attempt += 1
				continue
			}

			return response
		} catch (error) {
			clearTimeout(timeout)
			if (attempt + 1 < MAX_ATTEMPTS) {
				attempt += 1
				continue
			}
			throw normalizeNetworkError(error)
		}
	}

	throw new GenieGreenieClientError(
		'Genie Greenie request failed after retries',
		'UPSTREAM',
		502
	)
}

function parseError(response: Response, bodyText: string): never {
	if (response.status === 400) {
		throw new GenieGreenieClientError(
			bodyText || 'Invalid Genie Greenie request',
			'BAD_REQUEST',
			400
		)
	}

	if (response.status === 401) {
		throw new GenieGreenieClientError(
			bodyText || 'Unauthorized with Genie Greenie API',
			'UNAUTHORIZED',
			401
		)
	}

	throw new GenieGreenieClientError(
		bodyText || 'Genie Greenie API error',
		'UPSTREAM',
		response.status
	)
}

function isMicroskillStatus(value: unknown): value is GenieGreenieMicroskillStatus {
	return (
		value === 'not_started' ||
		value === 'in_progress' ||
		value === 'active' ||
		value === 'renewal_required'
	)
}

function isCertificateStatus(
	value: unknown
): value is GenieGreenieCertificateStatus {
	return value === 'active' || value === 'renewal_required'
}

export async function lookupCertificatesByEmail(
	email: string
): Promise<GenieGreenieCertificatesLookupResponse> {
	const normalizedEmail = email.trim().toLowerCase()
	if (!normalizedEmail) {
		throw new GenieGreenieClientError('Email is required', 'BAD_REQUEST', 400)
	}

	const response = await fetchWithRetry('/api/certificates/lookup', {
		method: 'POST',
		body: JSON.stringify({ email: normalizedEmail }),
	})

	if (!response.ok) {
		const bodyText = await response.text()
		parseError(response, bodyText)
	}

	const payload = (await response.json()) as Partial<GenieGreenieCertificatesLookupResponse>
	const certificates = Array.isArray(payload.certificates)
		? payload.certificates
		: null

	if (!payload.email || !certificates) {
		throw new GenieGreenieClientError(
			'Invalid lookup response from Genie Greenie',
			'INVALID_RESPONSE'
		)
	}

	const validCertificates: GenieGreeniePartnerCertificate[] = certificates.filter(
		(cert): cert is GenieGreeniePartnerCertificate =>
			typeof cert?.microskillSlug === 'string' &&
			typeof cert?.microskillTitle === 'string' &&
			typeof cert?.badgeIcon === 'string' &&
			typeof cert?.continueUrl === 'string' &&
			typeof cert?.dateEarned === 'string' &&
			typeof cert?.earnedVersion === 'number' &&
			typeof cert?.currentVersion === 'number' &&
			isCertificateStatus(cert?.status)
	)

	return {
		email: payload.email,
		certificates: validCertificates,
	}
}

export async function lookupMicroskillStatusesByEmail(
	email: string
): Promise<GenieGreenieLookupWithProgressResponse> {
	const normalizedEmail = email.trim().toLowerCase()
	if (!normalizedEmail) {
		throw new GenieGreenieClientError('Email is required', 'BAD_REQUEST', 400)
	}

	const response = await fetchWithRetry('/api/certificates/lookup-with-progress', {
		method: 'POST',
		body: JSON.stringify({ email: normalizedEmail }),
	})

	if (!response.ok) {
		const bodyText = await response.text()
		parseError(response, bodyText)
	}

	const payload = (await response.json()) as Partial<GenieGreenieLookupWithProgressResponse>
	const statuses = Array.isArray(payload.statuses) ? payload.statuses : null

	if (!payload.email || !statuses) {
		throw new GenieGreenieClientError(
			'Invalid lookup response from Genie Greenie',
			'INVALID_RESPONSE'
		)
	}

	const validStatuses: GenieGreenieMicroskillProgress[] = statuses.filter(
		(item): item is GenieGreenieMicroskillProgress =>
			typeof item?.microskillId === 'number' &&
			typeof item?.microskillSlug === 'string' &&
			typeof item?.microskillTitle === 'string' &&
			typeof item?.badgeIcon === 'string' &&
			typeof item?.continueUrl === 'string' &&
			(item?.dateEarned === null || typeof item?.dateEarned === 'string') &&
			(item?.earnedVersion === null || typeof item?.earnedVersion === 'number') &&
			typeof item?.currentVersion === 'number' &&
			typeof item?.requiredCompleted === 'number' &&
			typeof item?.requiredTotal === 'number' &&
			typeof item?.percent === 'number' &&
			isMicroskillStatus(item?.status)
	)

	return {
		email: payload.email,
		statuses: validStatuses,
	}
}

export function normalizeStatusesBySlug(
	items: GenieGreenieMicroskillProgress[]
): Record<string, GenieGreenieMicroskillProgress> {
	return Object.fromEntries(items.map((item) => [item.microskillSlug, item]))
}
