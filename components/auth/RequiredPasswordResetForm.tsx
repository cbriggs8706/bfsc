'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { toast } from 'sonner'
import { changePassword } from '@/app/actions/change-password'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

type Props = {
	locale: string
}

export function RequiredPasswordResetForm({ locale }: Props) {
	const router = useRouter()
	const [currentPassword, setCurrentPassword] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [isPending, startTransition] = useTransition()

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()

		if (newPassword.length < 8) {
			toast.error('Your new password must be at least 8 characters long.')
			return
		}

		if (newPassword !== confirmPassword) {
			toast.error('Your new passwords do not match.')
			return
		}

		startTransition(async () => {
			const result = await changePassword({ currentPassword, newPassword })

			if (!result.success) {
				toast.error(result.message || 'Unable to update your password.')
				return
			}

			toast.success('Password updated. Please sign in again with your new password.')
			await signOut({
				redirect: false,
				callbackUrl: `/${locale}/login`,
			})
			router.replace(`/${locale}/login`)
			router.refresh()
		})
	}

	return (
		<div className="min-h-screen flex items-center justify-center px-4 py-10">
			<Card className="w-full max-w-lg">
				<CardHeader className="space-y-2">
					<CardTitle>Reset your password</CardTitle>
					<p className="text-sm text-muted-foreground">
						Your account was created with a temporary password. Before you can
						continue, choose a new password you&apos;ll remember.
					</p>
				</CardHeader>
				<CardContent>
					<form className="space-y-5" onSubmit={handleSubmit}>
						<Field>
							<FieldLabel htmlFor="required-reset-current">
								Temporary password
							</FieldLabel>
							<Input
								id="required-reset-current"
								type="password"
								autoComplete="current-password"
								value={currentPassword}
								onChange={(event) => setCurrentPassword(event.target.value)}
								placeholder="Password1234"
							/>
							<FieldDescription>
								Use the temporary password your admin gave you.
							</FieldDescription>
						</Field>

						<Field>
							<FieldLabel htmlFor="required-reset-new">New password</FieldLabel>
							<Input
								id="required-reset-new"
								type="password"
								autoComplete="new-password"
								value={newPassword}
								onChange={(event) => setNewPassword(event.target.value)}
							/>
						</Field>

						<Field>
							<FieldLabel htmlFor="required-reset-confirm">
								Confirm new password
							</FieldLabel>
							<Input
								id="required-reset-confirm"
								type="password"
								autoComplete="new-password"
								value={confirmPassword}
								onChange={(event) => setConfirmPassword(event.target.value)}
							/>
						</Field>

						<div className="flex justify-end">
							<Button type="submit" disabled={isPending}>
								{isPending ? 'Saving…' : 'Update password'}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	)
}
