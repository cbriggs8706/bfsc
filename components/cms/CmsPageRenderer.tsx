import Link from 'next/link'

import type { CmsPageRecord } from '@/db/queries/cms'
import { Button } from '@/components/ui/button'

function anchorId(value: string, fallback: string) {
	const normalized = value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-+|-+$/g, '')

	return normalized || fallback
}

function widthClass(maxWidth: CmsPageRecord['maxWidth']) {
	switch (maxWidth) {
		case 'narrow':
			return 'max-w-3xl'
		case 'wide':
			return 'max-w-7xl'
		default:
			return 'max-w-5xl'
	}
}

function spacingClass(spacing: CmsPageRecord['sectionSpacing']) {
	switch (spacing) {
		case 'compact':
			return 'space-y-8'
		case 'airy':
			return 'space-y-16'
		default:
			return 'space-y-12'
	}
}

function pageSurfaceClass(backgroundStyle: CmsPageRecord['backgroundStyle']) {
	switch (backgroundStyle) {
		case 'accent':
			return 'bg-linear-to-b from-(--green-logo-soft) via-background to-(--blue-accent-soft)'
		case 'card':
			return 'bg-linear-to-b from-card via-background to-(--gray-accent-soft)'
		default:
			return 'bg-background'
	}
}

function sectionClass(template: string) {
	switch (template) {
		case 'accent':
			return 'rounded-3xl border border-border/70 bg-(--green-logo-soft) p-6 md:p-8'
		case 'callout':
			return 'rounded-3xl border border-border/70 bg-card shadow-sm p-6 md:p-8'
		default:
			return 'rounded-3xl border border-border/70 bg-card shadow-sm p-6 md:p-8'
	}
}

function ctaVariantClass(variant: CmsPageRecord['ctaButtons'][number]['variant']) {
	return variant === 'primary' ? 'default' : variant
}

export function CmsPageRenderer({ page }: { page: CmsPageRecord }) {
	const visibleSections = page.sections.filter((section) => section.isVisible)
	const pageWidthClass = widthClass(page.maxWidth)
	const pageSpacingClass = spacingClass(page.sectionSpacing)

	return (
		<div className={`min-h-full ${pageSurfaceClass(page.backgroundStyle)}`}>
			<div className={`mx-auto w-full ${pageWidthClass} p-4 space-y-6`}>
				<div>
					<h1 className="text-3xl font-bold">{page.title}</h1>
					{page.excerpt ? (
						<p className="max-w-3xl text-sm text-muted-foreground">
							{page.excerpt}
						</p>
					) : null}
					{page.ctaButtons.length > 0 ? (
						<div className="mt-4 flex flex-wrap gap-3">
							{page.ctaButtons.map((cta, index) => (
								<Button
									key={`${cta.label}-${index}`}
									asChild
									variant={ctaVariantClass(cta.variant)}
								>
									<Link
										href={cta.href}
										target={cta.openInNewTab ? '_blank' : undefined}
										rel={cta.openInNewTab ? 'noreferrer' : undefined}
									>
										{cta.label}
									</Link>
								</Button>
							))}
						</div>
					) : null}
				</div>

				<div
					className={
						page.showSectionNav
							? 'grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]'
							: ''
					}
				>
					<div className={pageSpacingClass}>
						{visibleSections.map((section, index) => {
							const sectionId = anchorId(
								section.heading || section.internalName,
								`section-${index + 1}`
							)

							return (
								<section key={sectionId} id={sectionId} className="space-y-3">
									{section.heading ? (
										<h2 className="text-xl font-semibold">{section.heading}</h2>
									) : null}

									<div className={sectionClass(section.template)}>
										<div
											className="prose prose-stone max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-a:text-(--green-logo) prose-a:decoration-(--green-logo) prose-a:underline-offset-2 prose-li:marker:text-foreground [&_ul]:list-disc [&_ul]:list-outside [&_ul]:pl-6 [&_ul]:ml-0 [&_ol]:list-decimal [&_ol]:list-outside [&_ol]:pl-6 [&_ol]:ml-0 [&_li]:list-item"
											dangerouslySetInnerHTML={{ __html: section.bodyHtml }}
										/>
									</div>
								</section>
							)
						})}
					</div>

					{page.showSectionNav ? (
						<aside className="hidden lg:block">
							<div className="sticky top-24 rounded-[1.75rem] border border-border/70 bg-card/85 p-5 shadow-sm">
								<p className="text-sm font-semibold">Jump to section</p>
								<div className="mt-4 space-y-3">
									{visibleSections.map((section, index) => (
										<Link
											key={`${section.internalName}-${index}-aside`}
											href={`#${anchorId(section.heading || section.internalName, `section-${index + 1}`)}`}
											className="block text-sm leading-6 text-muted-foreground transition-colors hover:text-foreground"
										>
											{section.heading || section.internalName}
										</Link>
									))}
								</div>
							</div>
						</aside>
					) : null}
				</div>
			</div>
		</div>
	)
}
