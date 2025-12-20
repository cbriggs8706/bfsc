// app/[locale]/layout.tsx
import { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { Toaster } from 'sonner'
import { eq } from 'drizzle-orm'

import { authOptions } from '@/lib/auth'
import { LOCALES, type Locale } from '@/i18n/config'
import { NextAuthProvider } from '../providers/session-provider'

import {
	SidebarProvider,
	SidebarInset,
	SidebarTrigger,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { AppSidebar } from '@/components/nav/AppSidebar'

import { db, operatingHours, specialHours } from '@/db'

export default async function LocaleLayout({
	children,
	params,
}: {
	children: ReactNode
	params: Promise<{ locale: string }>
}) {
	const { locale } = await params
	if (!LOCALES.includes(locale as Locale)) notFound()

	const messages = await getMessages({ locale })
	const session = await getServerSession(authOptions)

	// Sidebar data (now globally available)
	const weekly = await db.select().from(operatingHours)
	const specials = await db
		.select()
		.from(specialHours)
		.where(eq(specialHours.isClosed, true))

	return (
		<NextIntlClientProvider messages={messages} locale={locale}>
			<NextAuthProvider>
				<SidebarProvider>
					<AppSidebar
						session={session}
						role={session?.user?.role ?? 'Patron'}
						weekly={weekly}
						specials={specials}
					/>

					<SidebarInset>
						{/* Header */}
						<header className="flex h-16 shrink-0 items-center gap-2 border-b">
							<div className="flex items-center gap-2 px-4">
								<SidebarTrigger className="-ml-1" />

								<Separator
									orientation="vertical"
									className="mr-2 data-[orientation=vertical]:h-4"
								/>

								<Breadcrumb>
									<BreadcrumbList>
										<BreadcrumbItem className="hidden md:block">
											<BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
										</BreadcrumbItem>
										<BreadcrumbSeparator className="hidden md:block" />
										<BreadcrumbItem>
											<BreadcrumbPage>Home</BreadcrumbPage>
										</BreadcrumbItem>
									</BreadcrumbList>
								</Breadcrumb>
							</div>
						</header>

						{/* Page content */}
						<main className="flex flex-1 flex-col gap-4 p-4 pt-0">
							{children}
						</main>
					</SidebarInset>
				</SidebarProvider>

				<Toaster richColors position="top-center" />
			</NextAuthProvider>
		</NextIntlClientProvider>
	)
}
