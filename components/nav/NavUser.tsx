'use client'

import {
	BadgeCheck,
	Bell,
	ChevronsUpDown,
	LayoutDashboard,
	LogOut,
} from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from '@/components/ui/sidebar'
import { Session } from 'next-auth'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { useUserProfile } from '@/hooks/use-user-profile'
import { useNotificationCount } from '@/hooks/use-notification-count'
import { CountBadge } from './CountBadge'

export function NavUser({
	session,
	account,
	notifications,
	logout,
	login,
	register,
	locale,
	dashboard,
}: {
	session: Session | null
	account: string
	notifications: string
	logout: string
	login: string
	register: string
	locale: string
	dashboard: string
}) {
	const { isMobile } = useSidebar()
	const { profile } = useUserProfile()
	const userId = session?.user?.id
	const { count: notificationCount } = useNotificationCount(userId)

	// --------------------------
	// GUEST MODE (no session)
	// --------------------------
	if (!session) {
		return (
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton asChild>
						<Link
							href={`/${locale}/login`}
							className="w-full flex items-center gap-2"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								className="size-4"
							>
								<path d="M15 3h4a2 2 0 0 1 2 2v4" />
								<path d="M10 14 21 3" />
								<path d="M21 3l-7 0" />
								<path d="M3 12v7a2 2 0 0 0 2 2h7" />
							</svg>
							{login}
						</Link>
					</SidebarMenuButton>
				</SidebarMenuItem>

				<SidebarMenuItem>
					<SidebarMenuButton asChild>
						<Link
							href={`/${locale}/register`}
							className="w-full flex items-center gap-2"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								className="size-4"
							>
								<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
								<circle cx="8.5" cy="7" r="4" />
								<line x1="20" y1="8" x2="20" y2="14" />
								<line x1="23" y1="11" x2="17" y2="11" />
							</svg>
							{register}
						</Link>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		)
	}
	const resolvedImageUrl =
		profile?.profileImageUrl ?? session?.user?.image ?? undefined

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
							<Avatar className="h-8 w-8 rounded-full">
								<AvatarImage
									src={resolvedImageUrl}
									alt={session.user.name ?? 'BFSC User'}
								/>
								<AvatarFallback className="rounded-lg">FS</AvatarFallback>
							</Avatar>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium">
									{session.user.name}
								</span>
								<span className="truncate text-xs">{session.user.email}</span>
							</div>
							<ChevronsUpDown className="ml-auto size-4" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
						side={isMobile ? 'bottom' : 'right'}
						align="end"
						sideOffset={4}
					>
						<DropdownMenuLabel className="p-0 font-normal">
							<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
								<Avatar className="h-8 w-8 rounded-full">
									<AvatarImage
										src={resolvedImageUrl}
										alt={session.user.name ?? 'BFSC User'}
									/>
									<AvatarFallback className="rounded-lg">TL</AvatarFallback>
								</Avatar>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-medium">
										{session.user.name}
									</span>
									<span className="truncate text-xs">{session.user.email}</span>
								</div>
							</div>
						</DropdownMenuLabel>
						{/*<DropdownMenuSeparator />
						 <DropdownMenuGroup>
							<DropdownMenuItem>
								<Sparkles />
								Upgrade to Pro
							</DropdownMenuItem>
						</DropdownMenuGroup> */}
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<Link href={`/${locale}/dashboard`}>
								<DropdownMenuItem>
									<LayoutDashboard />
									{dashboard}
								</DropdownMenuItem>
							</Link>
							<Link href={`/${locale}/dashboard/account`}>
								<DropdownMenuItem>
									<BadgeCheck />
									{account}
								</DropdownMenuItem>
							</Link>
							{/* <DropdownMenuItem>
								<CreditCard />
								Billing
							</DropdownMenuItem> */}
							<Link href={`/${locale}/notifications`}>
								<DropdownMenuItem className="flex items-center justify-between gap-2">
									<div className="flex items-center gap-2">
										<Bell />
										{notifications}
									</div>

									<CountBadge count={notificationCount} />
								</DropdownMenuItem>
							</Link>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })}>
							<LogOut />
							{logout}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	)
}
