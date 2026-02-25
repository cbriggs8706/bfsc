// components/auth/login.tsx
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
import { getSession, signIn } from 'next-auth/react'
import GoogleLogo from '../logos/LogoGoogle'

const formSchema = z.object({
	username: z.string().min(3, 'Username must be at least 3 characters long.'),
	password: z.string().min(8, 'Password must be at least 8 characters long.'),
})

type Props = {
	redirectTo: string
}

function safeRedirect(path: string, locale: string) {
	try {
		const decoded = decodeURIComponent(path)

		if (!decoded.startsWith(`/${locale}`)) {
			return `/${locale}/dashboard`
		}

		return decoded
	} catch {
		return `/${locale}/dashboard`
	}
}

export function LoginForm({ redirectTo }: Props) {
	const router = useRouter()
	const { locale } = useParams() as { locale: string }
	const t = useTranslations('auth.login')
	const safeRedirectTo = safeRedirect(redirectTo, locale)

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			username: '',
			password: '',
		},
	})

	async function onSubmit(data: z.infer<typeof formSchema>) {
		try {
			const res = await signIn('credentials', {
				username: data.username,
				password: data.password,
				redirect: false,
				callbackUrl: safeRedirectTo,
			})

			if (res?.error) {
				toast.error(t('failure') || '❌ Invalid username or password.')
				return
			}

			toast.success(t('success') || '✅ Logged in!')

			// const session = await getSession()
			// const role = session?.user?.role

			// if (role === 'Admin') {
			// 	router.push(`/${locale}`)
			// } else {
			// 	router.push(`/${locale}`)
			// }
			router.replace(res?.url ?? `/${locale}/dashboard`)
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
					Burley FamilySearch Center{' '}
					<CardTitle className="mt-4 text-xl font-semibold tracking-tight">
						{t('title')}
					</CardTitle>
					<CardDescription>{t('description')}</CardDescription>
				</CardHeader>

				<CardContent className="relative z-10 mt-4">
					<Button
						type="button"
						className="w-full gap-3 mb-6"
						onClick={() => signIn('google', { callbackUrl: safeRedirectTo })}
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

					<form id="login-form" onSubmit={form.handleSubmit(onSubmit)}>
						<FieldGroup>
							<Controller
								name="username"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel htmlFor="login-username">
											{t('usernameLabel')}
										</FieldLabel>
										<Input
											{...field}
											id="login-username"
											type="text"
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
								name="password"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel htmlFor="login-password">
											{t('passwordLabel')}
										</FieldLabel>
										<Input
											{...field}
											id="login-password"
											type="password"
											placeholder={t('passwordPlaceholder')}
											autoComplete="current-password"
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
						<div className="mt-2 flex justify-between">
							<Link
								href={`/${locale}/forgot-password`}
								className="text-sm text-muted-foreground underline hover:text-foreground"
							>
								{t('forgotPassword')}
							</Link>

							<Link
								href={`/${locale}/reset-with-code`}
								className="text-sm text-muted-foreground underline hover:text-foreground"
							>
								{t('haveResetCode')}
							</Link>
						</div>
					</form>
				</CardContent>

				<CardFooter className="relative z-10 flex flex-col items-center">
					<Button
						type="submit"
						form="login-form"
						className="w-full mb-3"
						disabled={form.formState.isSubmitting}
					>
						{form.formState.isSubmitting
							? t('loading') ?? 'Signing in…'
							: t('submitButton')}
					</Button>

					<p className="text-sm text-center text-muted-foreground">
						{t('noAccount')}{' '}
						<Link
							href={`/${locale}/register`}
							className="underline hover:text-foreground"
						>
							{t('signupLink')}
						</Link>
					</p>
				</CardFooter>
			</Card>
		</div>
	)
}
