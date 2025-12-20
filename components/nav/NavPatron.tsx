// components/nav/NavPatron.tsx
'use client'

import { ChevronRight, type LucideIcon } from 'lucide-react'

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from '@/components/ui/sidebar'
import { MentionCount } from '@/components/cases/MentionCount'
import { useSession } from 'next-auth/react'
import { CaseView } from '@/lib/cases/views'
import { useCaseCounts } from '../cases/UseCaseCounts'
import { CountBadge } from './CountBadge'

type NavItem = {
	title: string
	url: string
	icon: LucideIcon
	isActive?: boolean
	isMentionItem?: boolean
	items?: {
		title: string
		url: string
		badgeKey?: CaseView
	}[]
}

export function NavPatron({
	items,
	label,
}: {
	label?: string
	items: NavItem[]
}) {
	const { data: session } = useSession()
	const { count } = MentionCount(session?.user?.id)
	const { counts } = useCaseCounts()

	return (
		<SidebarGroup>
			<SidebarGroupLabel>{label}</SidebarGroupLabel>
			<SidebarMenu>
				{items.map((item) => (
					<Collapsible key={item.title} asChild defaultOpen={item.isActive}>
						<SidebarMenuItem>
							<SidebarMenuButton asChild tooltip={item.title}>
								<a href={item.url}>
									<item.icon />
									<span className="text-sm">{item.title}</span>
									{item.isMentionItem && count > 0 && (
										<CountBadge count={count} />
									)}
								</a>
							</SidebarMenuButton>
							{item.items?.length ? (
								<>
									<CollapsibleTrigger asChild>
										<SidebarMenuAction className="data-[state=open]:rotate-90">
											<ChevronRight />
											<span className="sr-only">Toggle</span>
										</SidebarMenuAction>
									</CollapsibleTrigger>
									<CollapsibleContent>
										<SidebarMenuSub>
											{item.items?.map((subItem) => (
												<SidebarMenuSubItem key={subItem.title}>
													<SidebarMenuSubButton asChild>
														<a
															href={subItem.url}
															className="flex items-center justify-between gap-2 w-full"
														>
															<span className="text-sm">{subItem.title}</span>

															{subItem.badgeKey &&
																counts[subItem.badgeKey] > 0 && (
																	<span className="h-5 min-w-5 rounded-full bg-muted px-1 text-[11px] flex items-center justify-center">
																		{counts[subItem.badgeKey]}
																	</span>
																)}
														</a>
													</SidebarMenuSubButton>
												</SidebarMenuSubItem>
											))}
										</SidebarMenuSub>
									</CollapsibleContent>
								</>
							) : null}
						</SidebarMenuItem>
					</Collapsible>
				))}
			</SidebarMenu>
		</SidebarGroup>
	)
}
