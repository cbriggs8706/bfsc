import { getRequestConfig } from 'next-intl/server'
import fs from 'fs'
import path from 'path'

// 👇 List of supported locales in your app
const SUPPORTED_LOCALES = ['en', 'es', 'pt']

async function loadAllMessages(locale: string) {
	// ✅ Guarantee valid locale folder exists
	if (!SUPPORTED_LOCALES.includes(locale)) {
		console.warn(`[i18n] Invalid locale "${locale}" — falling back to "en"`)
		locale = 'en'
	}

	const dir = path.join(process.cwd(), 'messages', locale)
	if (!fs.existsSync(dir)) {
		console.warn(
			`[i18n] Missing messages folder for locale "${locale}" (${dir})`
		)
		return {}
	}

	const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'))
	const messages: Record<string, Record<string, unknown>> = {}

	for (const file of files) {
		const namespace = path.basename(file, '.json')
		const content = fs.readFileSync(path.join(dir, file), 'utf-8')
		messages[namespace] = JSON.parse(content)
	}

	return messages
}

export default getRequestConfig(async ({ locale }) => {
	const resolvedLocale =
		locale && SUPPORTED_LOCALES.includes(locale) ? locale : 'en'

	const messages = await loadAllMessages(resolvedLocale)

	return {
		locale: resolvedLocale,
		messages,
	}
})
