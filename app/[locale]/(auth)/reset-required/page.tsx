import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { RequiredPasswordResetForm } from '@/components/auth/RequiredPasswordResetForm'

type Props = {
	params: Promise<{ locale: string }>
}

export default async function ResetRequiredPage({ params }: Props) {
	const { locale } = await params
	const session = await getServerSession(authOptions)

	if (!session?.user?.id) {
		redirect(`/${locale}/login`)
	}

	if (
		!session.user.mustResetPassword ||
		session.user.authProvider !== 'credentials'
	) {
		redirect(`/${locale}/dashboard`)
	}

	return <RequiredPasswordResetForm locale={locale} />
}
