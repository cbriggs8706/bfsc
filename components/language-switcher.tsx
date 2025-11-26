'use client'

import { LANGUAGES } from '@/i18n/languages'
import { usePathname, useRouter } from 'next/navigation'
import { startTransition } from 'react'
import { setLocale } from '@/app/actions/set-locale'

export function LanguageSwitcher({ locale }: { locale: string }) {
	const router = useRouter()
	const pathname = usePathname()
	const locales = Object.keys(LANGUAGES)

	async function handleChange(nextLocale: string) {
		if (!pathname) return

		// ✅ Save cookie (server action)
		await setLocale(nextLocale)

		// ✅ Replace the locale segment
		const segments = pathname.split('/')
		segments[1] = nextLocale

		startTransition(() => {
			router.push(segments.join('/') || '/')
		})
	}

	return (
		<select
			className="border rounded px-2 py-1 bg-white"
			value={locale}
			onChange={(e) => handleChange(e.target.value)}
		>
			{locales.map((loc) => (
				<option key={loc} value={loc}>
					{LANGUAGES[loc].label}
				</option>
			))}
		</select>
	)
}
