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
import { useTranslations } from 'next-intl'
import { buildSidebarData, mergeCmsMenuGroups } from '@/lib/sidebar-data'
import { Separator } from '../ui/separator'
import { NavMain } from './NavMain'
import { SidebarLanguageSwitcher } from './SidebarLanguageSwitcher'
import { SidebarCalendar } from './SidebarCalendar'
import { NavWorker } from './NavWorker'
import type { CmsMenuGroups } from '@/types/cms'

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
	locale,
	effectivePermissions,
	weekly,
	specials,
	centerTimeZone,
	cmsMenuGroups,
	...props
}: {
	session: Session | null
	role: string
	locale: string
	effectivePermissions: string[]
	weekly: Weekly[]
	specials: Specials[]
	centerTimeZone: string
	cmsMenuGroups?: CmsMenuGroups
} & React.ComponentProps<typeof Sidebar>) {
	const t = useTranslations()
	const data = mergeCmsMenuGroups(buildSidebarData(t, locale), cmsMenuGroups)
	const hasAdminRole = ['Admin', 'Director', 'Assistant Director'].includes(role)
	const canAccessReservations =
		effectivePermissions.includes('reservations.view') ||
		effectivePermissions.includes('reservations.edit')
	const baseAdminItems =
		role === 'Assistant Director'
			? data.admin.filter(
					(item) => item.url !== `/${locale}/admin/groups/scheduler`
				)
			: data.admin
	const adminItems = hasAdminRole
		? baseAdminItems
		: canAccessReservations
			? baseAdminItems.filter(
					(item) => item.url === `/${locale}/admin/reservation`
				)
			: []
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
				{adminItems.length > 0 && (
					<>
						<NavAdmin items={adminItems} label={t('sidebar.admin.title')} />
						<Separator className="my-0" />
					</>
				)}
			</SidebarContent>
			<SidebarFooter>
				<SidebarCalendar
					specials={specials}
					weekly={weekly}
					locale={locale}
					centerTimeZone={centerTimeZone}
				/>
				<SidebarLanguageSwitcher
					locale={locale ?? 'en'}
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
					locale={locale ?? 'en'}
				/>
			</SidebarFooter>
		</Sidebar>
	)
}
