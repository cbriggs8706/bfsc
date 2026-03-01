// app/actions/newsletter.ts
'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { and, eq, ne } from 'drizzle-orm'
import { db } from '@/db'
import {
	newsletterPosts,
	newsletterTranslations,
	newsletterPostTags,
	newsletterPostCategories,
} from '@/db/schema/tables/newsletters'
import { getCurrentUser } from '@/lib/auth'
import { NewsletterLocale } from '@/types/newsletters'
import { can } from '@/lib/permissions/can'

function slugify(value: string): string {
	return value
		.toLowerCase()
		.trim()
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 120)
}

function normalizeExcerpt(value: string): string {
	return value
		.replace(/&nbsp;|&#160;/gi, ' ')
		.replace(/\u00a0/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
}

async function ensureUniqueSlug(
	tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
	baseInput: string,
	currentPostId?: string | null
): Promise<string> {
	const baseSlug = slugify(baseInput) || `newsletter-${Date.now()}`
	let candidate = baseSlug
	let suffix = 2

	for (;;) {
		const where = currentPostId
			? and(
					eq(newsletterPosts.slug, candidate),
					ne(newsletterPosts.id, currentPostId)
			  )
			: eq(newsletterPosts.slug, candidate)

		const existing = await tx
			.select({ id: newsletterPosts.id })
			.from(newsletterPosts)
			.where(where)
			.limit(1)

		if (!existing.length) return candidate

		const withSuffix = `${baseSlug}-${suffix}`
		candidate = slugify(withSuffix)
		suffix += 1
	}
}

/**
 * Canonical server action for:
 * - create
 * - update
 * - publish
 * - unpublish
 *
 * Controlled by formData "intent":
 *   - draft
 *   - publish
 *   - unpublish
 */
async function saveNewsletterInternal(
	formData: FormData,
	forcedIntent?: 'draft' | 'publish' | 'unpublish'
): Promise<void> {
	const debugId = crypto.randomUUID().slice(0, 8)
	const user = await getCurrentUser()
	if (!user) throw new Error('Unauthorized')

	// ----------------------------
	// Core fields
	// ----------------------------
	const id = formData.get('id') as string | null
	const locale = formData.get('locale') as string
	const slugRaw = (formData.get('slug') as string) || ''
	const coverImageUrl = (formData.get('coverImageUrl') as string) || null

	const intent =
		forcedIntent ??
		((formData.get('intent') as 'draft' | 'publish' | 'unpublish') ?? 'draft')
	const enExcerptRaw = formData.get('translations.en.excerpt')
	const enExcerptInput =
		typeof enExcerptRaw === 'string' ? enExcerptRaw : undefined
	console.log('[newsletter.save:start]', {
		debugId,
		forcedIntent: forcedIntent ?? null,
		formIntent: (formData.get('intent') as string | null) ?? null,
		resolvedIntent: intent,
		id,
		locale,
		hasEnExcerptField: formData.has('translations.en.excerpt'),
		enExcerptInputLength: enExcerptInput?.length ?? null,
		enExcerptInputPreview: enExcerptInput?.slice(0, 80) ?? null,
	})

	const isUpdate = Boolean(id)
	const canCreate = await can(user.id, user.role, 'newsletters.create')
	const canUpdate = await can(user.id, user.role, 'newsletters.update')
	const canPublish = await can(user.id, user.role, 'newsletters.publish')

	if (!isUpdate && !canCreate) {
		throw new Error('Unauthorized')
	}
	if (isUpdate && !canUpdate) {
		throw new Error('Unauthorized')
	}
	if ((intent === 'publish' || intent === 'unpublish') && !canPublish) {
		throw new Error('Unauthorized')
	}

	const status = intent === 'publish' ? 'published' : 'draft'

	const publishedAt =
		intent === 'publish'
			? new Date(
					(formData.get('publishedAt') as string) || new Date().toISOString()
			  )
			: null

	// ----------------------------
	// Parse translations
	// ----------------------------
	const locales: NewsletterLocale[] = ['en', 'es', 'pt']
	const existingTranslations = isUpdate
		? await db.query.newsletterTranslations.findMany({
				where: eq(newsletterTranslations.postId, id!),
			})
		: []
	const existingByLocale = new Map<
		NewsletterLocale,
		{ title: string; excerpt: string; content: string }
	>(
		existingTranslations.map((row) => [
			row.locale as NewsletterLocale,
			{
				title: row.title ?? '',
				excerpt: row.excerpt ?? '',
				content: row.content ?? '',
			},
		])
	)
	const fieldValue = (key: string): string | undefined => {
		const value = formData.get(key)
		return typeof value === 'string' ? value : undefined
	}
	const translations: Record<
		NewsletterLocale,
		{ title: string; excerpt: string; content: string }
	> = locales.reduce(
		(acc, localeKey) => {
			const existing = existingByLocale.get(localeKey)
			const title =
				fieldValue(`translations.${localeKey}.title`) ?? existing?.title ?? ''
			const excerptRaw =
				fieldValue(`translations.${localeKey}.excerpt`) ??
				existing?.excerpt ??
				''
			acc[localeKey] = {
				title,
				excerpt: normalizeExcerpt(excerptRaw),
				content:
					fieldValue(`translations.${localeKey}.content`) ??
					existing?.content ??
					'',
			}
			return acc
		},
		{} as Record<
			NewsletterLocale,
			{ title: string; excerpt: string; content: string }
		>
	)
	const requestedSlug = slugRaw || translations.en.title || `newsletter-${Date.now()}`

	// ----------------------------
	// Parse tags & categories
	// ----------------------------
	const tagIds = formData.getAll('tagIds') as string[]
	const categoryIds = formData.getAll('categoryIds') as string[]

	// ----------------------------
	// Transaction
	// ----------------------------
	try {
		let savedPostId: string | null = id
		let savedSlug: string | null = null
		await db.transaction(async (tx) => {
			let postId = id

			const uniqueSlug = await ensureUniqueSlug(tx, requestedSlug, postId)
			savedSlug = uniqueSlug

			// ---------- CREATE ----------
			if (!postId) {
				const [post] = await tx
					.insert(newsletterPosts)
					.values({
						slug: uniqueSlug,
						status,
						publishedAt,
						coverImageUrl,
						authorId: user.id,
					})
					.returning()

				postId = post.id
			}
			savedPostId = postId

			// ---------- UPDATE ----------
			await tx
				.update(newsletterPosts)
				.set({
					slug: uniqueSlug,
					status,
					publishedAt,
					coverImageUrl,
					updatedAt: new Date(),
				})
				.where(eq(newsletterPosts.id, postId))

			// ---------- TRANSLATIONS ----------
			for (const localeKey of Object.keys(translations) as NewsletterLocale[]) {
				const t = translations[localeKey]

				await tx
					.insert(newsletterTranslations)
					.values({
						postId,
						locale: localeKey,
						title: t.title,
						excerpt: t.excerpt,
						content: t.content,
					})
					.onConflictDoUpdate({
						target: [
							newsletterTranslations.postId,
							newsletterTranslations.locale,
						],
						set: {
							title: t.title,
							excerpt: t.excerpt,
							content: t.content,
							updatedAt: new Date(),
						},
					})
			}

			// ---------- TAGS ----------
			await tx
				.delete(newsletterPostTags)
				.where(eq(newsletterPostTags.postId, postId))

			if (tagIds.length) {
				await tx.insert(newsletterPostTags).values(
					tagIds.map((tagId) => ({
						postId,
						tagId,
					}))
				)
			}

			// ---------- CATEGORIES ----------
			await tx
				.delete(newsletterPostCategories)
				.where(eq(newsletterPostCategories.postId, postId))

			if (categoryIds.length) {
				await tx.insert(newsletterPostCategories).values(
					categoryIds.map((categoryId) => ({
						postId,
						categoryId,
					}))
				)
			}

			const [savedPost] = await tx
				.select({
					id: newsletterPosts.id,
					status: newsletterPosts.status,
					publishedAt: newsletterPosts.publishedAt,
					updatedAt: newsletterPosts.updatedAt,
				})
				.from(newsletterPosts)
				.where(eq(newsletterPosts.id, postId))
				.limit(1)
			const [savedEnTranslation] = await tx
				.select({
					excerpt: newsletterTranslations.excerpt,
					title: newsletterTranslations.title,
				})
				.from(newsletterTranslations)
				.where(
					and(
						eq(newsletterTranslations.postId, postId),
						eq(newsletterTranslations.locale, 'en')
					)
				)
				.limit(1)

			console.log('[newsletter.save:done]', {
				debugId,
				id: savedPost?.id ?? postId,
				status: savedPost?.status ?? null,
				publishedAt: savedPost?.publishedAt ?? null,
				updatedAt: savedPost?.updatedAt ?? null,
				enTitleLength: savedEnTranslation?.title?.length ?? null,
				enExcerptLength: savedEnTranslation?.excerpt?.length ?? null,
				enExcerptPreview: savedEnTranslation?.excerpt?.slice(0, 80) ?? null,
			})
		})
		revalidatePath(`/${locale}/admin/newsletter`)
		if (savedPostId) {
			revalidatePath(`/${locale}/admin/newsletter/update/${savedPostId}`)
		}
		revalidatePath(`/${locale}/newsletters`)
		if (savedSlug) {
			revalidatePath(`/${locale}/newsletters/${savedSlug}`)
		}
	} catch (error) {
		console.error('[newsletter.save] failed', {
			debugId,
			id,
			intent,
			locale,
			requestedSlug,
			error,
		})
		throw new Error('Failed to save newsletter')
	}

	// ----------------------------
	// Redirect after success
	// ----------------------------
	redirect(`/${locale}/admin/newsletter`)
}

export async function saveNewsletter(formData: FormData): Promise<void> {
	console.log('[newsletter.action] saveNewsletter')
	return saveNewsletterInternal(formData)
}

export async function saveDraftNewsletter(formData: FormData): Promise<void> {
	console.log('[newsletter.action] saveDraftNewsletter')
	return saveNewsletterInternal(formData, 'draft')
}

export async function publishNewsletter(formData: FormData): Promise<void> {
	console.log('[newsletter.action] publishNewsletter')
	return saveNewsletterInternal(formData, 'publish')
}

/**
 * Hard delete
 */
export async function deleteNewsletter(
	id: string,
	locale: string
): Promise<void> {
	const user = await getCurrentUser()
	if (!user) throw new Error('Unauthorized')
	if (!(await can(user.id, user.role, 'newsletters.delete'))) {
		throw new Error('Unauthorized')
	}

	await db.delete(newsletterPosts).where(eq(newsletterPosts.id, id))
	redirect(`/${locale}/admin/newsletter`)
}
