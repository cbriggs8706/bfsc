#!/usr/bin/env node

import 'dotenv/config'
import postgres from 'postgres'

const DEFAULT_SOURCE =
	'https://burleyfamilyhistorycenter.blogspot.com/feeds/posts/default?alt=json'

function parseArgs(argv) {
	const args = {
		source: DEFAULT_SOURCE,
		write: false,
		authorId: '',
		pageSize: 150,
	}

	for (let i = 2; i < argv.length; i += 1) {
		const arg = argv[i]
		if (arg === '--write') {
			args.write = true
			continue
		}
		if (arg.startsWith('--source=')) {
			args.source = arg.slice('--source='.length)
			continue
		}
		if (arg.startsWith('--author-id=')) {
			args.authorId = arg.slice('--author-id='.length)
			continue
		}
		if (arg.startsWith('--page-size=')) {
			const size = Number(arg.slice('--page-size='.length))
			if (Number.isFinite(size) && size > 0) args.pageSize = Math.floor(size)
			continue
		}
	}

	return args
}

function stripHtml(html) {
	return html
		.replace(/<style[\s\S]*?<\/style>/gi, ' ')
		.replace(/<script[\s\S]*?<\/script>/gi, ' ')
		.replace(/<[^>]+>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
}

function toExcerpt(html, max = 240) {
	const plain = stripHtml(html)
	if (!plain) return ''
	return plain.length > max ? `${plain.slice(0, max - 1).trimEnd()}…` : plain
}

function slugify(input) {
	return input
		.toLowerCase()
		.normalize('NFKD')
		replace(/[\u0300-\u036f]/g, '')
		replace(/[^a-z0-9]+/g, '-')
		replace(/^-+|-+$/g, '')
		replace(/-{2,}/g, '-')
		.slice(0, 120)
}

function dateKey(dateLike) {
	if (!dateLike) return ''
	const d = new Date(dateLike)
	if (Number.isNaN(d.getTime())) return ''
	return d.toISOString().slice(0, 10)
}

function getEntryUrl(entry) {
	const links = Array.isArray(entry?.link) ? entry.link : []
	const alt = links.find((l) => l?.rel === 'alternate' && l?.href)
	return alt?.href ?? ''
}

function slugFromEntry(entry) {
	const url = getEntryUrl(entry)
	if (url) {
		try {
			const pathname = new URL(url).pathname
			const last = pathname.split('/').filter(Boolean).pop() || ''
			const raw = last.replace(/\.html?$/i, '')
			const fromUrl = slugify(raw)
			if (fromUrl) return fromUrl
		} catch {
			// no-op fallback below
		}
	}

	const title = String(entry?.title?.$t ?? '').trim()
	const published = String(entry?.published?.$t ?? '').trim()
	return slugify(`${title}-${dateKey(published)}`) || `post-${Date.now()}`
}

function firstImageFromHtml(html) {
	if (!html) return null
	const patterns = [
		/<img[^>]+src=["']([^"']+)["']/i,
		/<img[^>]+data-src=["']([^"']+)["']/i,
	]
	for (const re of patterns) {
		const match = html.match(re)
		if (match?.[1]) return match[1]
	}
	return null
}

async function fetchFeedPage(source, startIndex, pageSize) {
	const url = new URL(source)
	url.searchParams.set('max-results', String(pageSize))
	url.searchParams.set('start-index', String(startIndex))
	url.searchParams.set('orderby', 'published')

	const res = await fetch(url.toString())
	if (!res.ok) {
		throw new Error(`Feed request failed: ${res.status} ${res.statusText}`)
	}

	return res.json()
}

async function fetchAllEntries(source, pageSize) {
	const all = []
	let startIndex = 1

	while (true) {
		const payload = await fetchFeedPage(source, startIndex, pageSize)
		const feed = payload?.feed ?? {}
		const entries = Array.isArray(feed.entry) ? feed.entry : []
		if (entries.length === 0) break

		all.push(...entries)
		startIndex += entries.length

		const totalRaw = feed?.openSearch$totalResults?.$t
		const total = totalRaw ? Number(totalRaw) : NaN
		const reachedTotal = Number.isFinite(total) && all.length >= total
		if (entries.length < pageSize || reachedTotal) break
	}

	return all
}

function makeDedupeKey(title, publishedAt) {
	return `${(title ?? '').trim().toLowerCase()}|${dateKey(publishedAt)}`
}

function pickSlug(baseSlug, usedSlugs) {
	let slug = baseSlug || `post-${Date.now()}`
	let n = 2
	while (usedSlugs.has(slug)) {
		slug = `${baseSlug}-${n}`
		n += 1
	}
	usedSlugs.add(slug)
	return slug
}

async function getFallbackAuthorId(sql) {
	const admins = await sql`
		select id
		from "public.user"
		where role = 'Admin'
		order by email asc
		limit 1
	`
	if (admins[0]?.id) return admins[0].id

	const any = await sql`
		select id
		from "public.user"
		order by email asc
		limit 1
	`
	return any[0]?.id ?? ''
}

async function main() {
	const { source, write, authorId: authorArg, pageSize } = parseArgs(process.argv)
	const dbUrl = process.env.DATABASE_URL
	if (!dbUrl) throw new Error('DATABASE_URL is required')

	const sql = postgres(dbUrl, { ssl: 'require' })
	try {
		const authorId = authorArg || (await getFallbackAuthorId(sql))
		if (!authorId) {
			throw new Error(
				'No author found. Pass --author-id=<uuid> or create a user first.'
			)
		}

		const existingRows = await sql`
			select
				p.id,
				p.slug,
				p.published_at,
				t.title
			from newsletter_posts p
			left join newsletter_translations t
				on t.post_id = p.id and t.locale = 'en'
		`

		const existingSlugs = new Set(
			existingRows.map((r) => r.slug).filter(Boolean)
		)
		const usedSlugs = new Set(existingSlugs)
		const existingKeys = new Set(
			existingRows
				.map((r) => makeDedupeKey(r.title || '', r.published_at))
				.filter((v) => !v.startsWith('|'))
		)

		const entries = await fetchAllEntries(source, pageSize)
		const candidates = entries
			.map((entry) => {
				const title = String(entry?.title?.$t ?? '').trim()
				const publishedRaw = String(entry?.published?.$t ?? '').trim()
				const publishedAt = publishedRaw ? new Date(publishedRaw) : null
				const content = String(entry?.content?.$t ?? '').trim()
				const entryUrl = getEntryUrl(entry)

				return {
					title,
					publishedRaw,
					publishedAt,
					content,
					entryUrl,
					slugBase: slugFromEntry(entry),
					coverImageUrl: firstImageFromHtml(content),
				}
			})
			.filter(
				(item) =>
					item.title &&
					item.publishedAt &&
					!Number.isNaN(item.publishedAt.getTime()) &&
					item.content
			)

		let skipped = 0
		let imported = 0
		const pending = []

		for (const item of candidates) {
			const key = makeDedupeKey(item.title, item.publishedAt)
			if (existingKeys.has(key) || existingSlugs.has(item.slugBase)) {
				skipped += 1
				continue
			}

			const slug = pickSlug(item.slugBase, usedSlugs)
			existingKeys.add(key)

			pending.push({
				slug,
				publishedAt: item.publishedAt,
				title: item.title,
				content: item.content,
				excerpt: toExcerpt(item.content),
				coverImageUrl: item.coverImageUrl,
				entryUrl: item.entryUrl,
			})
		}

		console.log(
			`Found ${entries.length} feed entries, ${candidates.length} valid archive posts, ${pending.length} to import, ${skipped} skipped as existing.`
		)
		console.log(`Mode: ${write ? 'WRITE' : 'DRY RUN'}`)

		if (!write) {
			for (const sample of pending.slice(0, 10)) {
				console.log(
					`[dry-run] ${sample.publishedAt.toISOString()} | ${sample.slug} | ${sample.title}`
				)
			}
			return
		}

		for (const row of pending) {
			const inserted = await sql`
				insert into newsletter_posts (
					slug,
					status,
					featured,
					featured_order,
					cover_image_url,
					published_at,
					author_id
				) values (
					${row.slug},
					'published',
					false,
					null,
					${row.coverImageUrl},
					${row.publishedAt.toISOString()},
					${authorId}
				)
				returning id
			`
			const postId = inserted[0].id

			await sql`
				insert into newsletter_translations (
					post_id,
					locale,
					title,
					excerpt,
					content
				) values
				(${postId}, 'en', ${row.title}, ${row.excerpt}, ${row.content}),
				(${postId}, 'es', '', '', ''),
				(${postId}, 'pt', '', '', '')
			`

			imported += 1
			console.log(
				`[imported] ${row.publishedAt.toISOString()} | ${row.slug} | ${row.title}`
			)
		}

		console.log(`Imported ${imported} newsletters. Skipped ${skipped}.`)
	} finally {
		await sql.end({ timeout: 5 })
	}
}

main().catch((err) => {
	console.error(err)
	process.exit(1)
})
