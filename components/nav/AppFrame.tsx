import type { Session } from 'next-auth'
import { eq } from 'drizzle-orm'

import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { AppSidebar } from '@/components/nav/AppSidebar'
import AppBreadcrumbs from '@/components/nav/AppBreadcrumbs'
import { MentionAlerts } from '@/components/cases/MentionAlerts'
import { WorkerAlerts } from '@/components/worker/WorkerAlerts'
import FSHeader from '@/components/nav/FSHeader'
import MobileFooter from '@/components/nav/MobileFooterMenu'
import { db, operatingHours, specialHours } from '@/db'
import { getCenterTimeConfig } from '@/lib/time/center-time'
import type { CmsMenuGroups } from '@/types/cms'

export async function AppFrame({
	children,
	session,
	locale,
	role,
	cmsMenuGroups,
}: {
	children: React.ReactNode
	session: Session | null
	locale: string
	role: string
	cmsMenuGroups: CmsMenuGroups
}) {
	const weekly = await db.select().from(operatingHours)
	const specials = await db
		.select()
		.from(specialHours)
		.where(eq(specialHours.isClosed, true))
	const centerTime = await getCenterTimeConfig()

	return (
		<SidebarProvider>
			<AppSidebar
				session={session}
				role={role}
				locale={locale}
				weekly={weekly}
				specials={specials}
				centerTimeZone={centerTime.timeZone}
				cmsMenuGroups={cmsMenuGroups}
			/>
			<SidebarInset>
				<FSHeader />
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
				<div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
				<MobileFooter />
			</SidebarInset>
		</SidebarProvider>
	)
}
