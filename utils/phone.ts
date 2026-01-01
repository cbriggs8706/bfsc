import { parsePhoneNumberFromString } from 'libphonenumber-js'

export function normalizePhone(
	raw: string,
	defaultCountry: 'US' = 'US'
): string | null {
	const phone = parsePhoneNumberFromString(raw, defaultCountry)
	if (!phone || !phone.isValid()) return null
	return phone.format('E.164')
}

export function formatPhoneDisplay(e164: string): string {
	const phone = parsePhoneNumberFromString(e164)
	return phone ? phone.formatNational() : e164
}
