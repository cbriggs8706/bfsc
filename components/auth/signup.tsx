'use client'

import * as React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import GoogleLogo from '../logos/google'
import { signIn } from 'next-auth/react'

const formSchema = z.object({
	username: z.string().min(5, 'Username must be at least 5 characters long.'),
	email: z.string().email('Please enter a valid email address.'),
	password: z.string().min(8, 'Password must be at least 8 characters long.'),
})

export function SignUpForm() {
	const router = useRouter()
	const { locale } = useParams() as { locale: string }
	const t = useTranslations('auth.signup')

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			username: '',
			email: '',
			password: '',
		},
	})

	async function onSubmit(data: z.infer<typeof formSchema>) {
		try {
			const res = await fetch(`/api/auth/register`, {
				// 👈 remove locale here
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			})

			if (res.ok) {
				toast.success(t('success') || '✅ Account created!')
				await signIn('credentials', {
					redirect: false,
					username: data.email, // or data.username — whichever you accept
					password: data.password,
				})

				router.push(`/${locale}/dashboard`)
			} else {
				const result = await res.json()
				toast.error(result.error || t('failure') || '❌ Registration failed.')
			}
		} catch {
			toast.error(t('networkError') || 'Network error. Please try again.')
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center">
			<Card className="relative w-full max-w-sm border rounded-xl shadow-lg/5 dark:shadow-xl bg-linear-to-b from-muted/50 dark:from-transparent to-card overflow-hidden px-8 py-8">
				{/* Subtle grid + mask pattern background */}
				<div
					className="absolute inset-0 z-0 -top-px -left-px"
					style={{
						backgroundImage: `
              linear-gradient(to right, color-mix(in srgb, var(--card-foreground) 8%, transparent) 1px, transparent 1px),
              linear-gradient(to bottom, color-mix(in srgb, var(--card-foreground) 8%, transparent) 1px, transparent 1px)
            `,
						backgroundSize: '20px 20px',
						maskImage: `
              repeating-linear-gradient(to right, black 0px, black 3px, transparent 3px, transparent 8px),
              repeating-linear-gradient(to bottom, black 0px, black 3px, transparent 3px, transparent 8px),
              radial-gradient(ellipse 70% 50% at 50% 0%, #000 60%, transparent 100%)
            `,
						WebkitMaskImage: `
              repeating-linear-gradient(to right, black 0px, black 3px, transparent 3px, transparent 8px),
              repeating-linear-gradient(to bottom, black 0px, black 3px, transparent 3px, transparent 8px),
              radial-gradient(ellipse 70% 50% at 50% 0%, #000 60%, transparent 100%)
            `,
						maskComposite: 'intersect',
						WebkitMaskComposite: 'source-in',
					}}
				/>

				<CardHeader className="relative z-10 flex flex-col items-center">
					{/* <Logo className="h-9 w-9" /> */}Burley FamilySearch Center
					<CardTitle className="mt-4 text-xl font-semibold tracking-tight">
						{t('title')}
					</CardTitle>
					<CardDescription>{t('description')}</CardDescription>
				</CardHeader>

				<CardContent className="relative z-10 mt-4">
					<Button
						type="button"
						className="w-full gap-3 mb-6"
						onClick={() =>
							signIn('google', { callbackUrl: `/${locale}/dashboard` })
						}
					>
						<GoogleLogo />
						{t('googleButton')}
					</Button>

					<div className="my-6 w-full flex items-center justify-center">
						<Separator className="flex-1" />
						<span className="px-2 text-sm text-muted-foreground">
							{t('or')}
						</span>
						<Separator className="flex-1" />
					</div>

					<form id="signup-form" onSubmit={form.handleSubmit(onSubmit)}>
						<FieldGroup>
							<Controller
								name="username"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel htmlFor="signup-username">
											{t('usernameLabel')}
										</FieldLabel>
										<Input
											{...field}
											id="signup-username"
											type="username"
											placeholder={t('usernamePlaceholder')}
											autoComplete="username"
											aria-invalid={fieldState.invalid}
										/>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>
							<Controller
								name="email"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel htmlFor="signup-email">
											{t('emailLabel')}
										</FieldLabel>
										<Input
											{...field}
											id="signup-email"
											type="email"
											placeholder={t('emailPlaceholder')}
											autoComplete="email"
											aria-invalid={fieldState.invalid}
										/>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>

							<Controller
								name="password"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel htmlFor="signup-password">
											{t('passwordLabel')}
										</FieldLabel>
										<Input
											{...field}
											id="signup-password"
											type="password"
											placeholder={t('passwordPlaceholder')}
											autoComplete="new-password"
											aria-invalid={fieldState.invalid}
										/>
										<FieldDescription>
											{t('passwordDescription')}
										</FieldDescription>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>
						</FieldGroup>
					</form>
				</CardContent>

				<CardFooter className="relative z-10 flex flex-col items-center">
					<Button
						type="submit"
						form="signup-form"
						className="w-full mb-3"
						disabled={form.formState.isSubmitting}
					>
						{form.formState.isSubmitting
							? t('loading') ?? t('creating')
							: t('submitButton')}
					</Button>

					<p className="text-sm text-center text-muted-foreground">
						{t('alreadyHaveAccount')}{' '}
						<Link
							href={`/${locale}/dashboard`}
							className="underline hover:text-foreground"
						>
							{t('loginLink')}
						</Link>
					</p>
				</CardFooter>
			</Card>
		</div>
	)
}

export default SignUpForm
