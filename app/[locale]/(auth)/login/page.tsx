// app/[locale]/(auth)/login/page.tsx
import { LoginForm } from '@/components/auth/AuthLogin'

type Props = {
	searchParams: Promise<{ redirect?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
	const { redirect } = await searchParams

	const redirectTo = redirect ? decodeURIComponent(redirect) : '/'
	return <LoginForm redirectTo={redirectTo} />
}
