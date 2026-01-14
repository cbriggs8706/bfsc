import {
	parsePhoneNumberFromString,
	CountryCode,
	isSupportedCountry,
} from 'libphonenumber-js'

export function normalizePhoneToE164(
	raw: string,
	defaultCountry: CountryCode
): string | null {
	const phone = parsePhoneNumberFromString(raw, defaultCountry)
	if (!phone || !phone.isValid()) return null
	return phone.number // same as phone.format('E.164')
}

export function formatPhoneInternational(e164: string): string {
	const phone = parsePhoneNumberFromString(e164)
	return phone ? phone.formatInternational() : e164
}

export function formatPhoneNational(e164: string): string {
	const phone = parsePhoneNumberFromString(e164)
	return phone ? phone.formatNational() : e164
}

export function toCountryCode(
	value: unknown,
	fallback: CountryCode = 'US'
): CountryCode {
	const v = String(value ?? '').toUpperCase()
	return isSupportedCountry(v) ? (v as CountryCode) : fallback
}
