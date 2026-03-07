import type { Role } from '@/types/announcements'

export const CMS_PAGE_MAX_WIDTHS = ['narrow', 'standard', 'wide'] as const
export const CMS_PAGE_HERO_STYLES = ['none', 'banner', 'split'] as const
export const CMS_PAGE_BACKGROUND_STYLES = [
	'subtle',
	'accent',
	'card',
] as const
export const CMS_PAGE_SECTION_SPACING = [
	'compact',
	'comfortable',
	'airy',
] as const
export const CMS_SECTION_TEMPLATES = [
	'default',
	'accent',
	'callout',
] as const
export const CMS_SECTION_KINDS = ['richText'] as const
export const CMS_MENU_TARGETS = ['main', 'worker', 'admin'] as const
export const CMS_CTA_VARIANTS = ['primary', 'secondary', 'outline'] as const

export type CmsPageMaxWidth = (typeof CMS_PAGE_MAX_WIDTHS)[number]
export type CmsPageHeroStyle = (typeof CMS_PAGE_HERO_STYLES)[number]
export type CmsPageBackgroundStyle =
	(typeof CMS_PAGE_BACKGROUND_STYLES)[number]
export type CmsPageSectionSpacing = (typeof CMS_PAGE_SECTION_SPACING)[number]
export type CmsSectionTemplate = (typeof CMS_SECTION_TEMPLATES)[number]
export type CmsSectionKind = (typeof CMS_SECTION_KINDS)[number]
export type CmsMenuTarget = (typeof CMS_MENU_TARGETS)[number]
export type CmsCtaVariant = (typeof CMS_CTA_VARIANTS)[number]

export type CmsSectionInput = {
	internalName: string
	heading: string
	kind: CmsSectionKind
	template: CmsSectionTemplate
	bodyHtml: string
	isVisible: boolean
}

export type CmsCtaButtonInput = {
	label: string
	href: string
	variant: CmsCtaVariant
	openInNewTab: boolean
}

export type CmsPageInput = {
	id?: string
	locale: string
	title: string
	slug: string
	menuLabel: string
	iconName: string
	excerpt: string
	seoTitle: string
	seoDescription: string
	isPublic: boolean
	allowedRoles: Role[]
	showInMenu: boolean
	menuTargets: CmsMenuTarget[]
	ctaButtons: CmsCtaButtonInput[]
	maxWidth: CmsPageMaxWidth
	heroStyle: CmsPageHeroStyle
	backgroundStyle: CmsPageBackgroundStyle
	sectionSpacing: CmsPageSectionSpacing
	showSectionNav: boolean
	sections: CmsSectionInput[]
}

export type CmsMenuLink = {
	title: string
	url: string
	iconName: string
}

export type CmsMenuGroups = {
	main: CmsMenuLink[]
	worker: CmsMenuLink[]
	admin: CmsMenuLink[]
}
