'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
	Field,
	FieldGroup,
	FieldLabel,
	FieldError,
} from '@/components/ui/field'
import { useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const schema = z.object({
	identifier: z.string().min(3),
	code: z.string().length(6),
	password: z.string().min(8),
})

export function ResetWithCodeForm() {
	const t = useTranslations('auth.resetCode')
	const router = useRouter()
	const { locale } = useParams() as { locale: string }

	const [done, setDone] = useState(false)
	const [seconds, setSeconds] = useState(3)

	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
	})

	// ✅ redirect countdown
	useEffect(() => {
		if (!done) return

		const interval = setInterval(() => {
			setSeconds((s) => s - 1)
		}, 1000)

		const timeout = setTimeout(() => {
			router.replace(`/${locale}/login`)
		}, 3000)

		return () => {
			clearInterval(interval)
			clearTimeout(timeout)
		}
	}, [done, locale, router])

	if (done) {
		return (
			<p className="p-8 text-center text-muted-foreground">
				Redirecting to login in {seconds}…
			</p>
		)
	}

	async function onSubmit(values: z.infer<typeof schema>) {
		const res = await fetch('/api/auth/password-reset/confirm-code', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(values),
		})

		const data = await res.json()

		if (!res.ok) {
			toast.error(data.error ?? 'Reset failed')
			return
		}

		toast.success(t('success'))
		setDone(true)
	}

	return (
		<div className="min-h-screen flex items-center justify-center">
			<Card className="w-full max-w-sm px-8 py-8">
				<CardHeader>
					<CardTitle>{t('title')}</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<FieldGroup>
							<Field data-invalid={form.formState.errors.identifier}>
								<FieldLabel>{t('identifier')}</FieldLabel>
								<Input {...form.register('identifier')} />
								<FieldError errors={[form.formState.errors.identifier]} />
							</Field>

							<Field data-invalid={form.formState.errors.code}>
								<FieldLabel>{t('code')}</FieldLabel>
								<Input {...form.register('code')} />
								<FieldError errors={[form.formState.errors.code]} />
							</Field>

							<Field data-invalid={form.formState.errors.password}>
								<FieldLabel>{t('password')}</FieldLabel>
								<Input type="password" {...form.register('password')} />
								<FieldError errors={[form.formState.errors.password]} />
							</Field>
						</FieldGroup>

						<Button
							className="w-full mt-4"
							disabled={form.formState.isSubmitting}
						>
							{t('submit')}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	)
}
