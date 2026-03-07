import 'server-only'

import { and, asc, desc, eq } from 'drizzle-orm'

import { db } from '@/db'
import { cmsPage, cmsPageSection } from '@/db/schema/tables/cms'
import { getTenantKey } from '@/lib/tenant'
import type {
	CmsMenuGroups,
	CmsMenuLink,
	CmsCtaButtonInput,
	CmsCtaVariant,
	CmsPageInput,
	CmsPageBackgroundStyle,
	CmsPageHeroStyle,
	CmsMenuTarget,
	CmsPageMaxWidth,
	CmsPageSectionSpacing,
	CmsSectionKind,
	CmsSectionTemplate,
} from '@/types/cms'
import type { Role } from '@/types/announcements'

const RESERVED_CMS_SLUGS = new Set([
	'admin',
	'login',
	'register',
	'reset-password',
	'reset-with-code',
	'forgot-password',
	'calendar',
	'groups',
	'research-specialists',
	'consultant-helps',
	'projects',
	'memory-lane',
	'newsletters',
	'reservation',
	'dashboard',
	'notifications',
	'training',
	'classes',
	'cases',
	'library',
	'shifts',
	'substitutes',
	'kiosk',
])

export type CmsPageRow = typeof cmsPage.$inferSelect
export type CmsPageSectionRow = typeof cmsPageSection.$inferSelect

export type CmsSection = {
	id: string
	position: number
	internalName: string
	heading: string
	kind: CmsSectionKind
	template: CmsSectionTemplate
	bodyHtml: string
	isVisible: boolean
}

export type CmsPageRecord = {
	id: string
	tenantKey: string
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
	createdAt: Date
	updatedAt: Date
	sections: CmsSection[]
}

function asRoles(value: unknown): Role[] {
	if (!Array.isArray(value)) return []
	return value.filter((role): role is Role => typeof role === 'string')
}

function asLocalizedStrings(value: unknown): Record<string, string> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
	return Object.fromEntries(
		Object.entries(value as Record<string, unknown>).flatMap(
			([key, entryValue]) =>
				typeof entryValue === 'string' ? [[key, entryValue]] : [],
		),
	)
}

function getLocalizedString(
	mapValue: unknown,
	locale: string,
	fallback: string | null | undefined,
) {
	const map = asLocalizedStrings(mapValue)
	return map[locale] ?? fallback ?? ''
}

function asMenuTargets(value: unknown): CmsMenuTarget[] {
	if (!Array.isArray(value)) return []
	return value.filter(
		(target): target is CmsMenuTarget =>
			target === 'main' || target === 'worker' || target === 'admin',
	)
}

function asCtaButtons(value: unknown): CmsCtaButtonInput[] {
	if (!Array.isArray(value)) return []
	return value.flatMap((item) => {
		if (!item || typeof item !== 'object') return []
		const candidate = item as Record<string, unknown>
		const label = typeof candidate.label === 'string' ? candidate.label : ''
		const href = typeof candidate.href === 'string' ? candidate.href : ''
		const variant =
			candidate.variant === 'primary' ||
			candidate.variant === 'secondary' ||
			candidate.variant === 'outline'
				? (candidate.variant as CmsCtaVariant)
				: 'primary'

		if (!label.trim() || !href.trim()) return []

		return [
			{
				label,
				href,
				variant,
				openInNewTab: Boolean(candidate.openInNewTab),
			},
		]
	})
}

function asLocalizedCtaButtons(
	value: unknown,
	locale: string,
	fallback: unknown,
): CmsCtaButtonInput[] {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return asCtaButtons(fallback)
	}
	const localeValue = (value as Record<string, unknown>)[locale]
	return asCtaButtons(localeValue ?? fallback)
}

function setLocalizedString(
	existing: unknown,
	locale: string,
	value: string,
): Record<string, string> {
	return {
		...asLocalizedStrings(existing),
		[locale]: value,
	}
}

function setLocalizedCtaButtons(
	existing: unknown,
	locale: string,
	value: CmsCtaButtonInput[],
): Record<string, CmsCtaButtonInput[]> {
	const base =
		existing && typeof existing === 'object' && !Array.isArray(existing)
			? (existing as Record<string, CmsCtaButtonInput[]>)
			: {}
	return {
		...base,
		[locale]: value,
	}
}

function toSectionForLocale(
	row: CmsPageSectionRow,
	locale: string,
): CmsSection {
	return {
		id: row.id,
		position: row.position,
		internalName: getLocalizedString(
			row.internalNameI18n,
			locale,
			row.internalName,
		),
		heading: getLocalizedString(row.headingI18n, locale, row.heading),
		kind: row.kind as CmsSectionKind,
		template: row.template as CmsSectionTemplate,
		bodyHtml: getLocalizedString(row.bodyHtmlI18n, locale, row.bodyHtml),
		isVisible: row.isVisible,
	}
}

function toPage(
	row: CmsPageRow,
	sections: CmsPageSectionRow[],
	locale: string,
): CmsPageRecord {
	return {
		id: row.id,
		tenantKey: row.tenantKey,
		locale,
		title: getLocalizedString(row.titleI18n, locale, row.title),
		slug: row.slug,
		menuLabel: getLocalizedString(row.menuLabelI18n, locale, row.menuLabel),
		iconName: row.iconName ?? 'Files',
		excerpt: getLocalizedString(row.excerptI18n, locale, row.excerpt),
		seoTitle: row.seoTitle ?? '',
		seoDescription: row.seoDescription ?? '',
		isPublic: row.isPublic,
		allowedRoles: asRoles(row.allowedRoles),
		showInMenu: row.showInMenu,
		menuTargets: asMenuTargets(row.menuTargets),
		ctaButtons: asLocalizedCtaButtons(
			row.ctaButtonsI18n,
			locale,
			row.ctaButtons,
		),
		maxWidth: row.maxWidth as CmsPageMaxWidth,
		heroStyle: row.heroStyle as CmsPageHeroStyle,
		backgroundStyle: row.backgroundStyle as CmsPageBackgroundStyle,
		sectionSpacing: row.sectionSpacing as CmsPageSectionSpacing,
		showSectionNav: row.showSectionNav,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		sections: sections.map((section) => toSectionForLocale(section, locale)),
	}
}

export function normalizeCmsSlug(input: string) {
	return input
		.trim()
		.toLowerCase()
		.replace(/^\/+|\/+$/g, '')
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9/_-]/g, '')
		.replace(/\/{2,}/g, '/')
}

export function isReservedCmsSlug(slug: string) {
	return RESERVED_CMS_SLUGS.has(slug)
}

export async function listCmsPages(locale?: string) {
	const tenantKey = getTenantKey()
	const activeLocale = locale ?? 'en'
	const rows = await db
		.select()
		.from(cmsPage)
		.where(eq(cmsPage.tenantKey, tenantKey))
		.orderBy(asc(cmsPage.title))

	return rows.map((row) => ({
		...row,
		locale: activeLocale,
		title: getLocalizedString(row.titleI18n, activeLocale, row.title),
		menuLabel: getLocalizedString(
			row.menuLabelI18n,
			activeLocale,
			row.menuLabel,
		),
		excerpt: getLocalizedString(row.excerptI18n, activeLocale, row.excerpt),
	}))
}

export async function getCmsPageById(id: string, locale = 'en') {
	const tenantKey = getTenantKey()
	const page = await db.query.cmsPage.findFirst({
		where: and(eq(cmsPage.id, id), eq(cmsPage.tenantKey, tenantKey)),
	})

	if (!page) return null

	const sections = await db
		.select()
		.from(cmsPageSection)
		.where(eq(cmsPageSection.pageId, page.id))
		.orderBy(asc(cmsPageSection.position))

	return toPage(page, sections, locale)
}

export async function getCmsPageBySlug(locale: string, slug: string) {
	const tenantKey = getTenantKey()
	const normalizedSlug = normalizeCmsSlug(slug)
	const page = await db.query.cmsPage.findFirst({
		where: and(
			eq(cmsPage.tenantKey, tenantKey),
			eq(cmsPage.slug, normalizedSlug),
		),
	})

	if (!page) return null

	const sections = await db
		.select()
		.from(cmsPageSection)
		.where(eq(cmsPageSection.pageId, page.id))
		.orderBy(asc(cmsPageSection.position))

	return toPage(page, sections, locale)
}

export async function saveCmsPage(input: CmsPageInput) {
	const tenantKey = getTenantKey()
	const normalizedSlug = normalizeCmsSlug(input.slug)

	if (!normalizedSlug) {
		throw new Error('Page slug is required.')
	}

	if (isReservedCmsSlug(normalizedSlug)) {
		throw new Error('That slug is reserved by a hardcoded route.')
	}

	const duplicate = await db.query.cmsPage.findFirst({
		where: and(
			eq(cmsPage.tenantKey, tenantKey),
			eq(cmsPage.slug, normalizedSlug),
		),
	})

	if (duplicate && duplicate.id !== input.id) {
		throw new Error('A page already exists with that slug for this locale.')
	}

	const now = new Date()
	const existingPage = input.id
		? await db.query.cmsPage.findFirst({
				where: and(eq(cmsPage.id, input.id), eq(cmsPage.tenantKey, tenantKey)),
			})
		: null
	const existingSections = input.id
		? await db
				.select()
				.from(cmsPageSection)
				.where(eq(cmsPageSection.pageId, input.id))
				.orderBy(asc(cmsPageSection.position))
		: []

	return db.transaction(async (tx) => {
		const pageValues = {
			tenantKey,
			locale: input.locale,
			title: input.title.trim(),
			titleI18n: setLocalizedString(
				existingPage?.titleI18n,
				input.locale,
				input.title.trim(),
			),
			slug: normalizedSlug,
			menuLabel: input.menuLabel.trim() || null,
			menuLabelI18n: setLocalizedString(
				existingPage?.menuLabelI18n,
				input.locale,
				input.menuLabel.trim(),
			),
			iconName: input.iconName.trim() || 'Files',
			excerpt: input.excerpt.trim() || null,
			excerptI18n: setLocalizedString(
				existingPage?.excerptI18n,
				input.locale,
				input.excerpt.trim(),
			),
			seoTitle: input.seoTitle.trim() || null,
			seoDescription: input.seoDescription.trim() || null,
			isPublic: input.isPublic,
			allowedRoles: input.allowedRoles,
			showInMenu: input.showInMenu,
			menuTargets: input.menuTargets,
			ctaButtons: input.ctaButtons,
			ctaButtonsI18n: setLocalizedCtaButtons(
				existingPage?.ctaButtonsI18n,
				input.locale,
				input.ctaButtons,
			),
			maxWidth: input.maxWidth,
			heroStyle: input.heroStyle,
			backgroundStyle: input.backgroundStyle,
			sectionSpacing: input.sectionSpacing,
			showSectionNav: input.showSectionNav,
			updatedAt: now,
		}

		let pageId = input.id

		if (pageId) {
			await tx
				.update(cmsPage)
				.set(pageValues)
				.where(and(eq(cmsPage.id, pageId), eq(cmsPage.tenantKey, tenantKey)))

			await tx.delete(cmsPageSection).where(eq(cmsPageSection.pageId, pageId))
		} else {
			const [created] = await tx
				.insert(cmsPage)
				.values({
					...pageValues,
					createdAt: now,
				})
				.returning({ id: cmsPage.id })
			pageId = created.id
		}

		if (!pageId) {
			throw new Error('Could not save page.')
		}

		if (input.sections.length > 0) {
			await tx.insert(cmsPageSection).values(
				input.sections.map((section, index) => ({
					pageId,
					position: index,
					internalName: section.internalName.trim() || `Section ${index + 1}`,
					internalNameI18n: setLocalizedString(
						existingSections[index]?.internalNameI18n,
						input.locale,
						section.internalName.trim() || `Section ${index + 1}`,
					),
					heading: section.heading.trim() || null,
					headingI18n: setLocalizedString(
						existingSections[index]?.headingI18n,
						input.locale,
						section.heading.trim(),
					),
					kind: section.kind,
					template: section.template,
					bodyHtml: section.bodyHtml,
					bodyHtmlI18n: setLocalizedString(
						existingSections[index]?.bodyHtmlI18n,
						input.locale,
						section.bodyHtml,
					),
					isVisible: section.isVisible,
					createdAt: now,
					updatedAt: now,
				})),
			)
		}

		return pageId
	})
}

export async function deleteCmsPage(id: string) {
	const tenantKey = getTenantKey()
	await db
		.delete(cmsPage)
		.where(and(eq(cmsPage.id, id), eq(cmsPage.tenantKey, tenantKey)))
}

function uniqueLinks(items: CmsMenuLink[]) {
	const seen = new Set<string>()
	return items.filter((item) => {
		if (seen.has(item.url)) return false
		seen.add(item.url)
		return true
	})
}

export async function getCmsMenuGroups(
	locale: string,
	role: string,
): Promise<CmsMenuGroups> {
	const tenantKey = getTenantKey()
	const pages = await db
		.select()
		.from(cmsPage)
		.where(and(eq(cmsPage.tenantKey, tenantKey), eq(cmsPage.showInMenu, true)))
		.orderBy(desc(cmsPage.updatedAt), asc(cmsPage.title))

	const groups: CmsMenuGroups = {
		main: [],
		worker: [],
		admin: [],
	}

	for (const page of pages) {
		const allowedRoles = asRoles(page.allowedRoles)
		const menuTargets = asMenuTargets(page.menuTargets)
		const canView = page.isPublic || allowedRoles.includes(role as Role)
		if (!canView) continue

		const item = {
			title:
				getLocalizedString(
					page.menuLabelI18n,
					locale,
					page.menuLabel,
				)?.trim() || getLocalizedString(page.titleI18n, locale, page.title),
			url: `/${locale}/${page.slug}`,
			iconName: page.iconName?.trim() || 'Files',
		}

		if (menuTargets.includes('main')) {
			groups.main.push(item)
		}
		if (menuTargets.includes('worker')) {
			groups.worker.push(item)
		}
		if (menuTargets.includes('admin')) {
			groups.admin.push(item)
		}
	}

	return {
		main: uniqueLinks(groups.main),
		worker: uniqueLinks(groups.worker),
		admin: uniqueLinks(groups.admin),
	}
}
