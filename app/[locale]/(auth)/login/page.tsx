// app/[locale]/(auth)/login/page.tsx
import { LoginForm } from '@/components/auth/AuthLogin'

type Props = {
	params: Promise<{ locale: string }>
	searchParams: Promise<{ redirect?: string }>
}

export default async function LoginPage({ params, searchParams }: Props) {
	const { locale } = await params
	const { redirect } = await searchParams

	const redirectTo = redirect ? decodeURIComponent(redirect) : `/${locale}/dashboard`
	return <LoginForm redirectTo={redirectTo} />
}
