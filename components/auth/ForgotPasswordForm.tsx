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
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'

const schema = z.object({
	identifier: z.string().min(3),
})

export function ForgotPasswordForm() {
	const { locale } = useParams() as { locale: string }
	const t = useTranslations('auth.forgot')

	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: { identifier: '' },
	})

	async function onSubmit(values: z.infer<typeof schema>) {
		const res = await fetch('/api/auth/password-reset/request', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ identifier: values.identifier, locale }),
		})

		const data = await res.json()

		if (!res.ok) {
			toast.error(data.error ?? 'Request failed')
			return
		}

		toast.success(t('success'))
		form.reset()
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
								<FieldLabel>{t('label')}</FieldLabel>
								<Input {...form.register('identifier')} />
								<FieldError errors={[form.formState.errors.identifier]} />
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
