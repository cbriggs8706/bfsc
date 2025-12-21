'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
	Breadcrumb,
	BreadcrumbList,
	BreadcrumbItem,
	BreadcrumbPage,
	BreadcrumbLink,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { useTranslations } from 'next-intl'

export default function AppBreadcrumbs() {
	const pathname = usePathname()
	const tReader = useTranslations('reader')
	const tBooks = useTranslations('books')

	if (!pathname) return null

	// split into segments
	const raw = pathname.split('/').filter(Boolean)
	if (raw.length === 0) return null

	// remove locale
	const [localeSegment, ...segments] = raw

	const paths = segments.map((_, i) => {
		const joined = segments.slice(0, i + 1).join('/')
		return `/${localeSegment}/${joined}`
	})

	return (
		<Breadcrumb>
			<BreadcrumbList>
				{segments.map((seg, i) => {
					const label = getLabel(seg, tReader, tBooks)
					const href = paths[i]
					const isLast = i === segments.length - 1

					return (
						<div key={href} className="contents">
							<BreadcrumbItem>
								{isLast ? (
									<BreadcrumbPage>{label}</BreadcrumbPage>
								) : (
									<BreadcrumbLink asChild>
										<Link href={href}>{label}</Link>
									</BreadcrumbLink>
								)}
							</BreadcrumbItem>

							{!isLast && <BreadcrumbSeparator />}
						</div>
					)
				})}
			</BreadcrumbList>
		</Breadcrumb>
	)
}

/* ----------------------------
   SEGMENT LOCALIZATION LOGIC
----------------------------- */

function getLabel(
	seg: string,
	tReader: ReturnType<typeof useTranslations>,
	tBooks: ReturnType<typeof useTranslations>
) {
	// 1) Book slug (1_kings, ezra_nehemiah, etc)
	if (tBooks.has(seg)) {
		return tBooks(seg)
	}

	// 2) Chapter number → Chapter X
	if (/^\d+$/.test(seg)) {
		return `${tReader('breadcrumb.chapter')} ${seg}`
	}

	// 3) Known navigation segments
	if (tReader.has(`breadcrumb.${seg}`)) {
		return tReader(`breadcrumb.${seg}`)
	}

	// 4) Fallback — prettify the segment
	return seg.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
