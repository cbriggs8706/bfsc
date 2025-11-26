import type { LucideIcon } from 'lucide-react'

export interface SidebarSubItem {
	title: string
	url: string
}

export interface SidebarItem {
	title: string
	url: string
	icon: LucideIcon
	isActive?: boolean
	items?: SidebarSubItem[]
}

export interface SidebarInputItem {
	name: string
	url: string
	icon: LucideIcon
}

export interface SidebarLessonItem {
	name: string
	url: string
	icon: LucideIcon
}

export interface SidebarData {
	navMain: SidebarItem[]
	navSecondary: SidebarItem[]
	input: SidebarInputItem[]
	lesson: SidebarLessonItem[]
}
