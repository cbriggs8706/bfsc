// app/[locale]/(workers)/layout.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import AppBreadcrumbs from '@/components/nav/AppBreadcrumbs'

import { AppSidebar } from '@/components/nav/AppSidebar'
import { WorkerAlerts } from '@/components/worker/WorkerAlerts'
import { redirect } from 'next/navigation'
import { MentionAlerts } from '@/components/cases/MentionAlerts'
import { db, operatingHours, specialHours } from '@/db'
import { eq } from 'drizzle-orm'
import FSHeader from '@/components/nav/FSHeader'
import MobileFooter from '@/components/nav/MobileFooterMenu'

export default async function Layout({
	children,
}: {
	children: React.ReactNode
}) {
	const session = await getServerSession(authOptions)
	// if (!session) redirect(`/`)

	const weekly = await db.select().from(operatingHours)
	const specials = await db
		.select()
		.from(specialHours)
		.where(eq(specialHours.isClosed, true))

	return (
		<SidebarProvider>
			{' '}
			<AppSidebar
				session={session}
				role={session?.user?.role ?? 'Patron'}
				weekly={weekly}
				specials={specials}
			/>
			<SidebarInset>
				<FSHeader />
				{/* 🔔 Worker realtime alerts */}
				<MentionAlerts />
				{session?.user?.role !== 'Patron' ? <WorkerAlerts /> : null}
				<header className="flex h-16 shrink-0 items-center gap-2">
					<div className="flex items-center gap-2 px-4">
						<SidebarTrigger className="-ml-1" />

						<Separator
							orientation="vertical"
							className="mr-2 data-[orientation=vertical]:h-4"
						/>

						<AppBreadcrumbs />
					</div>
				</header>

				{/* Actual dashboard content */}
				<div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
				<MobileFooter />
			</SidebarInset>
			{/* <FloatingNavButton /> */}
		</SidebarProvider>
	)
}
