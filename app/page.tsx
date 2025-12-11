// app/page.tsx
import { headers, cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const SUPPORTED_LOCALES = ['en', 'es', 'nl', 'pt', 'he']
const DEFAULT_LOCALE = 'en'

export default async function HomeRedirect() {
	const cookieStore = await cookies() // ✅ await here
	const cookieLocale = cookieStore.get('locale')?.value

	const acceptLanguage = (await headers()).get('accept-language') || ''
	const browserLocale = acceptLanguage.split(',')[0]?.split('-')[0]

	const locale = SUPPORTED_LOCALES.includes(cookieLocale || '')
		? cookieLocale
		: SUPPORTED_LOCALES.includes(browserLocale || '')
		? browserLocale
		: DEFAULT_LOCALE

	redirect(`/${locale}`)
}
