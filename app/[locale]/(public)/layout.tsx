// app/[locale]/(app)/dashboard/layout.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

import {
	SidebarInset,
	SidebarProvider,
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

export default async function Layout({
	children,
}: {
	children: React.ReactNode
}) {
	const session = await getServerSession(authOptions)
	// if (!session) redirect(`/`)
	return (
		<SidebarProvider>
			<AppSidebar session={session} role={session?.user?.role ?? 'Patron'} />
			<SidebarInset>
				<header className="flex h-16 shrink-0 items-center gap-2">
					<div className="flex items-center gap-2 px-4">
						<SidebarTrigger className="-ml-1" />

						<Separator
							orientation="vertical"
							className="mr-2 data-[orientation=vertical]:h-4"
						/>

						{/* Replace with your actual dashboard breadcrumbs */}
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

				{/* Actual dashboard content */}
				<div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
			</SidebarInset>
		</SidebarProvider>
	)
}
