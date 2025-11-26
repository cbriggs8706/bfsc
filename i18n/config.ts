export const LOCALES = ['en', 'es', 'pt'] as const
export type Locale = (typeof LOCALES)[number]

export const defaultLocale: Locale = 'en'
