'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { deleteCmsPage, saveCmsPage } from '@/db/queries/cms'
import { requireRole } from '@/utils/require-role'
import {
	CMS_PAGE_BACKGROUND_STYLES,
	CMS_PAGE_HERO_STYLES,
	CMS_PAGE_MAX_WIDTHS,
	CMS_PAGE_SECTION_SPACING,
	CMS_CTA_VARIANTS,
	CMS_MENU_TARGETS,
	CMS_SECTION_KINDS,
	CMS_SECTION_TEMPLATES,
} from '@/types/cms'
import { ROLES, type Role } from '@/types/announcements'

const cmsSectionSchema = z.object({
	internalName: z.string().trim().min(1),
	heading: z.string().default(''),
	kind: z.enum(CMS_SECTION_KINDS),
	template: z.enum(CMS_SECTION_TEMPLATES),
	bodyHtml: z.string(),
	isVisible: z.boolean(),
})

const cmsCtaSchema = z.object({
	label: z.string().trim().min(1),
	href: z.string().trim().min(1),
	variant: z.enum(CMS_CTA_VARIANTS),
	openInNewTab: z.boolean(),
})

const cmsPageSchema = z.object({
	id: z.string().uuid().optional(),
	locale: z.string().trim().min(2),
	title: z.string().trim().min(1),
	slug: z.string().trim().min(1),
	menuLabel: z.string().default(''),
	iconName: z.string().default('Files'),
	excerpt: z.string().default(''),
	seoTitle: z.string().default(''),
	seoDescription: z.string().default(''),
	isPublic: z.boolean(),
	allowedRoles: z.array(
		z.custom<Role>((value) => ROLES.includes(value as Role), {
			message: 'Invalid role',
		})
	),
	showInMenu: z.boolean(),
	menuTargets: z.array(z.enum(CMS_MENU_TARGETS)),
	ctaButtons: z.array(cmsCtaSchema),
	maxWidth: z.enum(CMS_PAGE_MAX_WIDTHS),
	heroStyle: z.enum(CMS_PAGE_HERO_STYLES),
	backgroundStyle: z.enum(CMS_PAGE_BACKGROUND_STYLES),
	sectionSpacing: z.enum(CMS_PAGE_SECTION_SPACING),
	showSectionNav: z.boolean(),
	sections: z.array(cmsSectionSchema).min(1),
})

async function revalidateCmsPaths(locale: string, slug: string) {
	revalidatePath(`/${locale}/admin/pages`)
	revalidatePath(`/${locale}/admin/pages/create`)
	revalidatePath(`/${locale}/${slug}`)
}

export async function saveCmsPageAction(input: unknown) {
	const parsed = cmsPageSchema.parse(input)
	await requireRole(parsed.locale, ['Admin', 'Director', 'Assistant Director'])
	const id = await saveCmsPage(parsed)
	await revalidateCmsPaths(parsed.locale, parsed.slug)
	revalidatePath(`/${parsed.locale}/admin/pages/${id}`)
	return { id }
}

export async function deleteCmsPageAction(locale: string, id: string, slug: string) {
	await requireRole(locale, ['Admin', 'Director', 'Assistant Director'])
	await deleteCmsPage(id)
	await revalidateCmsPaths(locale, slug)
}
