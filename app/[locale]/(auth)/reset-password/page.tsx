// app/[locale]/(auth)/reset-password/page.tsx

import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'

export default async function ResetPasswordPage({
	searchParams,
}: {
	searchParams: Promise<{ uid?: string; token?: string }>
}) {
	const { uid, token } = await searchParams

	return <ResetPasswordForm uid={uid} token={token} />
}
