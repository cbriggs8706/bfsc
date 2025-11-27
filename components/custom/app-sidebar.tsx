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
import { NavMain } from './nav-main'
import { NavInput } from './nav-input'
import { NavSecondary } from './nav-secondary'
import { NavUser } from './nav-user'
import { Session } from 'next-auth'
import { SidebarLanguageSwitcher } from './sidebar-language-switcher'
import { useParams } from 'next/navigation'
import { NavLesson } from './nav-lesson'
import { useTranslations } from 'next-intl'
import { buildSidebarData, getTeacherNav } from '@/lib/sidebarData'
import { Separator } from '../ui/separator'

export function AppSidebar({
	session,
	role,
	...props
}: {
	session: Session | null
	role: string
} & React.ComponentProps<typeof Sidebar>) {
	const { locale } = useParams()
	const t = useTranslations()
	const data = buildSidebarData(t, locale as string)

	const teacherNav = getTeacherNav(t, locale as string)
	return (
		<Sidebar variant="inset" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" asChild>
							<a href="#">
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
				{role === 'admin' && (
					<>
						<NavMain items={teacherNav} label={t('sidebar.teacher.title')} />
						<Separator className="my-4" />
					</>
				)}
				<NavMain items={data.navMain} />
				{/* <NavLesson
					lesson={data.lesson}
					content={t('sidebar.lesson.lessonContent')}
				/> */}
				<NavInput
					input={data.input}
					label={t('sidebar.input.comprehensible')}
				/>
				{/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
			</SidebarContent>
			<SidebarFooter>
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
