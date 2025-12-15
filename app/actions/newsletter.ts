// app/actions/newsletter.ts
'use server'

import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import {
	newsletterPosts,
	newsletterTranslations,
	newsletterPostTags,
	newsletterPostCategories,
} from '@/db/schema/tables/newsletters'
import { getCurrentUser } from '@/lib/auth'
import { NewsletterLocale } from '@/types/newsletters'

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
export async function saveNewsletter(formData: FormData): Promise<void> {
	const user = await getCurrentUser()
	if (!user) throw new Error('Unauthorized')

	// ----------------------------
	// Core fields
	// ----------------------------
	const id = formData.get('id') as string | null
	const locale = formData.get('locale') as string
	const slug = formData.get('slug') as string
	const intent =
		(formData.get('intent') as 'draft' | 'publish' | 'unpublish') ?? 'draft'

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
	const translations: Record<
		NewsletterLocale,
		{ title: string; excerpt: string; content: string }
	> = {
		en: {
			title: formData.get('translations.en.title') as string,
			excerpt: (formData.get('translations.en.excerpt') as string) ?? '',
			content: formData.get('translations.en.content') as string,
		},
		es: {
			title: formData.get('translations.es.title') as string,
			excerpt: (formData.get('translations.es.excerpt') as string) ?? '',
			content: formData.get('translations.es.content') as string,
		},
		pt: {
			title: formData.get('translations.pt.title') as string,
			excerpt: (formData.get('translations.pt.excerpt') as string) ?? '',
			content: formData.get('translations.pt.content') as string,
		},
	}

	// ----------------------------
	// Parse tags & categories
	// ----------------------------
	const tagIds = formData.getAll('tagIds') as string[]
	const categoryIds = formData.getAll('categoryIds') as string[]

	// ----------------------------
	// Transaction
	// ----------------------------
	await db.transaction(async (tx) => {
		let postId = id

		// ---------- CREATE ----------
		if (!postId) {
			const [post] = await tx
				.insert(newsletterPosts)
				.values({
					slug,
					status,
					publishedAt,
					authorId: user.id,
				})
				.returning()

			postId = post.id
		}

		// ---------- UPDATE ----------
		await tx
			.update(newsletterPosts)
			.set({
				slug,
				status,
				publishedAt,
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
	})

	// ----------------------------
	// Redirect after success
	// ----------------------------
	redirect(`/${locale}/admin/newsletter`)
}

/**
 * Hard delete
 */
export async function deleteNewsletter(
	id: string,
	locale: string
): Promise<void> {
	await db.delete(newsletterPosts).where(eq(newsletterPosts.id, id))
	redirect(`/${locale}/admin/newsletter`)
}
