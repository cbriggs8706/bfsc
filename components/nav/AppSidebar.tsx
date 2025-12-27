// components/custom/app-sidebar.tsx

'use client'

import * as React from 'react'
import { Heart } from 'lucide-react'

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar'
import { NavAdmin } from './NavAdmin'
import { NavUser } from './NavUser'
import { Session } from 'next-auth'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { buildSidebarData } from '@/lib/sidebar-data'
import { Separator } from '../ui/separator'
import { NavMain } from './NavMain'
import { SidebarLanguageSwitcher } from './SidebarLanguageSwitcher'
import { SidebarCalendar } from './SidebarCalendar'
import { NavWorker } from './NavWorker'

type Weekly = {
	id: string
	weekday: number
	opensAt: string
	closesAt: string
	isClosed: boolean
	updatedAt: Date
}
type Specials = {
	id: string
	date: string
	isClosed: boolean
	reason: string | null
	opensAt: string | null
	closesAt: string | null
	updatedAt: Date | null
}

export function AppSidebar({
	session,
	role,
	weekly,
	specials,
	...props
}: {
	session: Session | null
	role: string
	weekly: Weekly[]
	specials: Specials[]
} & React.ComponentProps<typeof Sidebar>) {
	const { locale } = useParams()
	const t = useTranslations()
	const data = buildSidebarData(t, locale as string)
	return (
		<Sidebar variant="inset" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" asChild>
							<a href={`/${locale}`}>
								<div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
									<Heart className="size-4" />
								</div>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-medium">
										{t('sidebar.main.bfsc')}
									</span>
									<span className="truncate text-xs">
										{t('sidebar.main.freeForever')}
									</span>
								</div>
							</a>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={data.navMain} />
				{/* {[
					'Admin',
					'Director',
					'Assistant Director',
					'Worker',
					'Shift Lead',
					'Patron',
				].includes(role) && (
					<>
						<NavPatron items={data.patron} label={t('sidebar.patron.title')} />
						<Separator className="my-0" />
					</>
				)} */}
				{[
					'Admin',
					'Director',
					'Assistant Director',
					'Worker',
					'Shift Lead',
				].includes(role) && (
					<>
						<NavWorker items={data.worker} label={t('sidebar.worker.title')} />
						<Separator className="my-0" />
					</>
				)}
				{['Admin', 'Director', 'Assistant Director'].includes(role) && (
					<>
						<NavAdmin items={data.admin} label={t('sidebar.admin.title')} />
						<Separator className="my-0" />
					</>
				)}
			</SidebarContent>
			<SidebarFooter>
				<SidebarCalendar
					specials={specials}
					weekly={weekly}
					locale={locale as string}
				/>
				<SidebarLanguageSwitcher
					locale={(locale as string) ?? 'en'}
					label={t('sidebar.main.language')}
					choose={t('sidebar.main.chooseLanguage')}
				/>

				<NavUser
					session={session}
					dashboard={t('sidebar.user.dashboard')}
					account={t('sidebar.user.account')}
					notifications={t('sidebar.user.notifications')}
					logout={t('sidebar.user.logout')}
					login={t('sidebar.user.login')}
					register={t('sidebar.user.register')}
					locale={(locale as string) ?? 'en'}
				/>
			</SidebarFooter>
		</Sidebar>
	)
}
