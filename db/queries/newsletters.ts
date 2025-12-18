// db/queries/newsletters.ts
import { db, kioskPeople, user } from '@/db'
import {
	newsletterPosts,
	newsletterTranslations,
	newsletterPostTags,
	newsletterPostCategories,
	newsletterTags,
	newsletterSubscribers,
} from '@/db/schema/tables/newsletters'
import { and, desc, eq, isNotNull, isNull, sql } from 'drizzle-orm'
import { NewsletterFormData, NewsletterLocale } from '@/types/newsletters'

export async function getNewsletterForForm(
	id: string
): Promise<NewsletterFormData | null> {
	const post = await db.query.newsletterPosts.findFirst({
		where: eq(newsletterPosts.id, id),
	})

	if (!post) return null

	const translations = await db.query.newsletterTranslations.findMany({
		where: eq(newsletterTranslations.postId, id),
	})

	const tagRows = await db.query.newsletterPostTags.findMany({
		where: eq(newsletterPostTags.postId, id),
	})

	const categoryRows = await db.query.newsletterPostCategories.findMany({
		where: eq(newsletterPostCategories.postId, id),
	})

	const translationsByLocale: NewsletterFormData['translations'] = {
		en: { title: '', excerpt: '', content: '' },
		es: { title: '', excerpt: '', content: '' },
		pt: { title: '', excerpt: '', content: '' },
	}

	for (const t of translations) {
		const locale = t.locale as NewsletterLocale
		translationsByLocale[locale] = {
			title: t.title,
			excerpt: t.excerpt ?? '',
			content: t.content as string,
		}
	}

	return {
		id: post.id,
		slug: post.slug,
		status: post.status,
		featured: post.featured,
		featuredOrder: post.featuredOrder,
		coverImageUrl: post.coverImageUrl,
		publishedAt: post.publishedAt,

		translations: translationsByLocale,
		tagIds: tagRows.map((t) => t.tagId),
		categoryIds: categoryRows.map((c) => c.categoryId),
	}
}

export async function getPublicNewsletters(locale: NewsletterLocale) {
	const rows = await db
		.select({
			id: newsletterPosts.id,
			slug: newsletterPosts.slug,
			featured: newsletterPosts.featured,
			publishedAt: newsletterPosts.publishedAt,
			coverImageUrl: newsletterPosts.coverImageUrl,
			title: newsletterTranslations.title,
			excerpt: newsletterTranslations.excerpt,
			content: newsletterTranslations.content,
			tagSlug: newsletterTags.slug,
		})
		.from(newsletterPosts)
		.innerJoin(
			newsletterTranslations,
			and(
				eq(newsletterTranslations.postId, newsletterPosts.id),
				eq(newsletterTranslations.locale, locale)
			)
		)
		.leftJoin(
			newsletterPostTags,
			eq(newsletterPostTags.postId, newsletterPosts.id)
		)
		.leftJoin(newsletterTags, eq(newsletterTags.id, newsletterPostTags.tagId))
		.where(eq(newsletterPosts.status, 'published'))
		.orderBy(desc(newsletterPosts.publishedAt))

	return rows
}

export async function getPublicNewsletterBySlug(
	slug: string,
	locale: NewsletterLocale
) {
	const row = await db
		.select({
			id: newsletterPosts.id,
			slug: newsletterPosts.slug,
			publishedAt: newsletterPosts.publishedAt,
			coverImageUrl: newsletterPosts.coverImageUrl,
			title: newsletterTranslations.title,
			content: sql<string>`${newsletterTranslations.content}`,
		})
		.from(newsletterPosts)
		.innerJoin(
			newsletterTranslations,
			and(
				eq(newsletterTranslations.postId, newsletterPosts.id),
				eq(newsletterTranslations.locale, locale)
			)
		)
		.where(
			and(
				eq(newsletterPosts.slug, slug),
				eq(newsletterPosts.status, 'published')
			)
		)
		.limit(1)

	return row[0] ?? null
}

export async function getNewsletterEmailList() {
	const users = db
		.select({ email: user.email })
		.from(user)
		.where(isNotNull(user.email))

	const kiosk = db
		.select({ email: kioskPeople.email })
		.from(kioskPeople)
		.where(isNotNull(kioskPeople.email))

	const subs = db
		.select({ email: newsletterSubscribers.email })
		.from(newsletterSubscribers)
		.where(
			and(
				eq(newsletterSubscribers.isConfirmed, true),
				isNull(newsletterSubscribers.unsubscribedAt)
			)
		)

	const merged = [...(await users), ...(await kiosk), ...(await subs)]

	const emails = [...new Set(merged.map((e) => e.email!.toLowerCase()))]
	return emails
}
