'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Editor } from '@tinymce/tinymce-react'
import { Eye, GripVertical, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { saveCmsPageAction, deleteCmsPageAction } from '@/app/actions/cms-pages'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { LucideIconPicker } from '@/components/admin/pages/LucideIconPicker'
import { ROLES, type Role } from '@/types/announcements'
import {
	CMS_MENU_TARGETS,
	CMS_CTA_VARIANTS,
	CMS_PAGE_BACKGROUND_STYLES,
	CMS_PAGE_HERO_STYLES,
	CMS_PAGE_MAX_WIDTHS,
	CMS_PAGE_SECTION_SPACING,
	CMS_SECTION_TEMPLATES,
	type CmsCtaButtonInput,
	type CmsMenuTarget,
	type CmsPageInput,
	type CmsSectionInput,
} from '@/types/cms'
import { uploadCmsPageImage } from '@/utils/upload-cms-page-image'
import { getCmsAdminCopy } from '@/lib/cms-admin-copy'

type Props = {
	mode: 'create' | 'edit'
	locale: string
	initial: CmsPageInput
	pageId?: string
}

function normalizeSlug(input: string) {
	return input
		.trim()
		.toLowerCase()
		.replace(/^\/+|\/+$/g, '')
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9/_-]/g, '')
		.replace(/\/{2,}/g, '/')
}

export function PageBuilderForm({ mode, locale, initial, pageId }: Props) {
	const router = useRouter()
	const t = getCmsAdminCopy(locale)
	const [value, setValue] = useState<CmsPageInput>(initial)
	const [isSaving, setIsSaving] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)

	const previewHref = useMemo(() => {
		const slug = normalizeSlug(value.slug)
		return slug ? `/${locale}/${slug}` : null
	}, [locale, value.slug])

	const updateSection = (index: number, patch: Partial<CmsSectionInput>) => {
		setValue((current) => ({
			...current,
			sections: current.sections.map((section, sectionIndex) =>
				sectionIndex === index ? { ...section, ...patch } : section
			),
		}))
	}

	const moveSection = (index: number, direction: -1 | 1) => {
		setValue((current) => {
			const nextIndex = index + direction
			if (nextIndex < 0 || nextIndex >= current.sections.length) return current
			const sections = [...current.sections]
			const [section] = sections.splice(index, 1)
			sections.splice(nextIndex, 0, section)
			return { ...current, sections }
		})
	}

	const addSection = () => {
		setValue((current) => ({
			...current,
			sections: [
				...current.sections,
				{
					internalName: `${t.sectionNumber} ${current.sections.length + 1}`,
					heading: '',
					kind: 'richText',
					template: 'default',
					bodyHtml: '<p></p>',
					isVisible: true,
				},
			],
		}))
	}

	const updateCta = (index: number, patch: Partial<CmsCtaButtonInput>) => {
		setValue((current) => ({
			...current,
			ctaButtons: current.ctaButtons.map((cta, ctaIndex) =>
				ctaIndex === index ? { ...cta, ...patch } : cta
			),
		}))
	}

	const addCta = () => {
		setValue((current) => ({
			...current,
			ctaButtons: [
				...current.ctaButtons,
				{
					label: t.addCta,
					href: '/',
					variant: 'primary',
					openInNewTab: false,
				},
			],
		}))
	}

	const removeCta = (index: number) => {
		setValue((current) => ({
			...current,
			ctaButtons: current.ctaButtons.filter((_, ctaIndex) => ctaIndex !== index),
		}))
	}

	const removeSection = (index: number) => {
		setValue((current) => ({
			...current,
			sections: current.sections.filter((_, sectionIndex) => sectionIndex !== index),
		}))
	}

	const toggleRole = (role: Role, checked: boolean) => {
		setValue((current) => ({
			...current,
			allowedRoles: checked
				? [...current.allowedRoles, role]
				: current.allowedRoles.filter((existingRole) => existingRole !== role),
		}))
	}

	const toggleMenuTarget = (target: CmsMenuTarget, checked: boolean) => {
		setValue((current) => ({
			...current,
			menuTargets: checked
				? [...current.menuTargets, target]
				: current.menuTargets.filter((existingTarget) => existingTarget !== target),
		}))
	}

	const submit = async () => {
		if (!value.title.trim()) {
			toast.error(t.pageTitleRequired)
			return
		}
		if (!normalizeSlug(value.slug)) {
			toast.error(t.pageSlugRequired)
			return
		}
		if (value.sections.length === 0) {
			toast.error(t.addSectionRequired)
			return
		}

		setIsSaving(true)
		try {
			const payload = {
				...value,
				id: pageId,
				locale,
				slug: normalizeSlug(value.slug),
			}
			const result = await saveCmsPageAction(payload)
			toast.success(mode === 'create' ? t.pageCreated : t.pageUpdated)
			router.push(`/${locale}/admin/pages/${result.id}`)
			router.refresh()
		} catch (error) {
			console.error(error)
			toast.error(error instanceof Error ? error.message : t.saveFailed)
		} finally {
			setIsSaving(false)
		}
	}

	const deletePage = async () => {
		if (!pageId || !previewHref) return
		if (!window.confirm(t.deleteConfirm)) return

		setIsDeleting(true)
		try {
			await deleteCmsPageAction(locale, pageId, normalizeSlug(value.slug))
			toast.success(t.pageDeleted)
			router.push(`/${locale}/admin/pages`)
			router.refresh()
		} catch (error) {
			console.error(error)
			toast.error(t.deleteFailed)
		} finally {
			setIsDeleting(false)
		}
	}

	return (
		<div className="space-y-6">
			<Card className="border-border/70 bg-card/95 shadow-sm">
				<CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
					<div className="space-y-2">
						<CardTitle className="text-3xl">
							{mode === 'create' ? t.createCmsPage : t.editCmsPage}
						</CardTitle>
						<CardDescription className="max-w-2xl text-sm leading-6">
							{t.editorIntro}
						</CardDescription>
					</div>

					<div className="flex flex-wrap gap-3">
						{(['en', 'es', 'pt'] as const).map((targetLocale) => (
							<Button
								key={targetLocale}
								asChild
								variant={targetLocale === locale ? 'default' : 'outline'}
							>
								<Link
									href={
										pageId
											? `/${targetLocale}/admin/pages/${pageId}`
											: `/${targetLocale}/admin/pages/create`
									}
								>
									{t.locales[targetLocale]}
								</Link>
							</Button>
						))}
						{previewHref ? (
							<Button asChild variant="outline">
								<Link href={previewHref} target="_blank">
									<Eye className="mr-2 size-4" />
									{t.previewPage}
								</Link>
							</Button>
						) : null}
						<Button onClick={submit} disabled={isSaving}>
							{isSaving ? t.saving : t.saveLive}
						</Button>
						{mode === 'edit' ? (
							<Button
								variant="destructive"
								onClick={deletePage}
								disabled={isDeleting}
							>
								{isDeleting ? t.deleting : t.delete}
							</Button>
						) : null}
					</div>
				</CardHeader>

				<CardContent className="space-y-8">
					<section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="title">{t.pageTitle}</Label>
								<Input
									id="title"
									value={value.title}
									onChange={(event) =>
										setValue((current) => ({
											...current,
											title: event.target.value,
											menuLabel:
												current.menuLabel || event.target.value,
										}))
									}
								/>
							</div>

								<div className="grid gap-4 md:grid-cols-2">
									<div className="space-y-2">
									<Label htmlFor="slug">{t.slug}</Label>
									<Input
										id="slug"
										value={value.slug}
										onChange={(event) =>
											setValue((current) => ({
												...current,
												slug: event.target.value,
											}))
										}
									/>
									<p className="text-xs text-muted-foreground">
										{t.rendersAt} `/{locale}/
										{normalizeSlug(value.slug) || 'your-page'}`
									</p>
									</div>

									<div className="space-y-2">
										<Label htmlFor="menuLabel">{t.menuLabel}</Label>
										<Input
										id="menuLabel"
										value={value.menuLabel}
										onChange={(event) =>
											setValue((current) => ({
												...current,
												menuLabel: event.target.value,
											}))
										}
										/>
									</div>
								</div>

							<div className="space-y-2">
								<Label>{t.menuIcon}</Label>
								<LucideIconPicker
									value={value.iconName}
									onChange={(iconName) =>
										setValue((current) => ({ ...current, iconName }))
									}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="excerpt">{t.pageSummary}</Label>
								<Textarea
									id="excerpt"
									rows={3}
									value={value.excerpt}
									onChange={(event) =>
										setValue((current) => ({
											...current,
											excerpt: event.target.value,
										}))
									}
								/>
							</div>
						</div>

						<div className="space-y-4">
							<div className="rounded-2xl border border-border/70 bg-secondary/40 p-5">
								<p className="text-sm font-semibold text-foreground">{t.access}</p>
								<div className="mt-4 space-y-4">
									<div className="flex items-center justify-between rounded-xl border border-border/70 bg-card px-4 py-3">
										<div>
											<p className="text-sm font-medium">{t.grantPublicAccess}</p>
											<p className="text-xs text-muted-foreground">
												{t.publicAccessHelp}
											</p>
										</div>
										<Switch
											checked={value.isPublic}
											onCheckedChange={(checked) =>
												setValue((current) => ({
													...current,
													isPublic: checked,
												}))
											}
										/>
									</div>

									<div className="space-y-3">
										<p className="text-sm font-medium">{t.grantSignedInAccess}</p>
										<p className="text-xs text-muted-foreground">
											{t.signedInAccessHelp}
										</p>
										{value.isPublic ? (
											<p className="text-xs text-muted-foreground">
												{t.publicAccessStillApplies}
											</p>
										) : null}
										<div className="grid gap-2">
											{ROLES.map((role) => (
												<label
													key={role}
													className="flex items-center gap-3 rounded-xl border border-border/70 bg-card px-4 py-3"
												>
													<Checkbox
														checked={value.allowedRoles.includes(role)}
														onCheckedChange={(checked) =>
															toggleRole(role, checked === true)
														}
													/>
													<span className="text-sm">{role}</span>
												</label>
											))}
										</div>
									</div>
								</div>
							</div>

							<div className="rounded-2xl border border-border/70 bg-secondary/40 p-5">
								<p className="text-sm font-semibold text-foreground">{t.menus}</p>
								<div className="mt-4 space-y-4">
									<div className="flex items-center justify-between rounded-xl border border-border/70 bg-card px-4 py-3">
										<div>
											<p className="text-sm font-medium">{t.showInMenus}</p>
											<p className="text-xs text-muted-foreground">
												{t.showInMenusHelp}
											</p>
										</div>
										<Switch
											checked={value.showInMenu}
											onCheckedChange={(checked) =>
												setValue((current) => ({
													...current,
													showInMenu: checked,
												}))
											}
										/>
									</div>

									<div className="space-y-3">
										<p className="text-sm font-medium">{t.menuPlacement}</p>
										<p className="text-xs text-muted-foreground">
											{t.menuPlacementHelp}
										</p>
										<div className="grid gap-2">
											{CMS_MENU_TARGETS.map((target) => (
												<label
													key={target}
													className="flex items-center gap-3 rounded-xl border border-border/70 bg-card px-4 py-3"
												>
													<Checkbox
														checked={value.menuTargets.includes(target)}
														disabled={!value.showInMenu}
														onCheckedChange={(checked) =>
															toggleMenuTarget(target, checked === true)
														}
													/>
													<div>
														<p className="text-sm capitalize">{target}</p>
														<p className="text-xs text-muted-foreground">
															{target === 'main'
																? t.mainMenuHelp
																: target === 'worker'
																	? t.workerMenuHelp
																	: t.adminMenuHelp}
														</p>
													</div>
												</label>
											))}
										</div>
									</div>
								</div>
							</div>
						</div>
					</section>

					<Separator />

					<section className="space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<h2 className="text-xl font-semibold">{t.ctaButtons}</h2>
								<p className="text-sm text-muted-foreground">
									{t.ctaButtonsHelp}
								</p>
							</div>

							<Button type="button" variant="outline" onClick={addCta}>
								<Plus className="mr-2 size-4" />
								{t.addCta}
							</Button>
						</div>

						<div className="space-y-3">
							{value.ctaButtons.length === 0 ? (
								<div className="rounded-2xl border border-dashed border-border/70 bg-secondary/20 p-5 text-sm text-muted-foreground">
									{t.noCtas}
								</div>
							) : null}

							{value.ctaButtons.map((cta, index) => (
								<Card key={index} className="border-border/70">
									<CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_1.2fr_180px_auto]">
										<div className="space-y-2">
											<Label>{t.label}</Label>
											<Input
												value={cta.label}
												onChange={(event) =>
													updateCta(index, { label: event.target.value })
												}
											/>
										</div>
										<div className="space-y-2">
											<Label>{t.link}</Label>
											<Input
												value={cta.href}
												onChange={(event) =>
													updateCta(index, { href: event.target.value })
												}
											/>
										</div>
										<BuilderSelect
												label={t.variant}
											value={cta.variant}
											options={CMS_CTA_VARIANTS}
											onChange={(nextValue) =>
												updateCta(index, { variant: nextValue })
											}
										/>
										<div className="flex items-end gap-3">
											<label className="flex h-9 items-center gap-3 rounded-md border border-border/70 bg-secondary/20 px-3">
												<Checkbox
													checked={cta.openInNewTab}
													onCheckedChange={(checked) =>
														updateCta(index, {
															openInNewTab: checked === true,
														})
													}
												/>
												<span className="text-sm">{t.newTab}</span>
											</label>
											<Button
												type="button"
												variant="destructive"
												size="sm"
												onClick={() => removeCta(index)}
											>
												<Trash2 className="size-4" />
											</Button>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</section>

					<Separator />

					<section className="space-y-4">
						<div className="flex items-center justify-between">
							<div>
							<h2 className="text-xl font-semibold">{t.seo}</h2>
							<p className="text-sm text-muted-foreground">
								{t.seoHelp}
							</p>
							</div>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="seoTitle">{t.seoTitle}</Label>
								<Input
									id="seoTitle"
									value={value.seoTitle}
									onChange={(event) =>
										setValue((current) => ({
											...current,
											seoTitle: event.target.value,
										}))
									}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="seoDescription">{t.seoDescription}</Label>
								<Textarea
									id="seoDescription"
									rows={3}
									value={value.seoDescription}
									onChange={(event) =>
										setValue((current) => ({
											...current,
											seoDescription: event.target.value,
										}))
									}
								/>
							</div>
						</div>
					</section>

					<Separator />

					<section className="space-y-4">
						<div>
							<h2 className="text-xl font-semibold">{t.layout}</h2>
							<p className="text-sm text-muted-foreground">
								{t.layoutHelp}
							</p>
						</div>

						<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
							<BuilderSelect
								label={t.maxWidth}
								value={value.maxWidth}
								options={CMS_PAGE_MAX_WIDTHS}
								onChange={(nextValue) =>
									setValue((current) => ({ ...current, maxWidth: nextValue }))
								}
							/>
							<BuilderSelect
								label={t.heroStyle}
								value={value.heroStyle}
								options={CMS_PAGE_HERO_STYLES}
								onChange={(nextValue) =>
									setValue((current) => ({ ...current, heroStyle: nextValue }))
								}
							/>
							<BuilderSelect
								label={t.background}
								value={value.backgroundStyle}
								options={CMS_PAGE_BACKGROUND_STYLES}
								onChange={(nextValue) =>
									setValue((current) => ({
										...current,
										backgroundStyle: nextValue,
									}))
								}
							/>
							<BuilderSelect
								label={t.sectionSpacing}
								value={value.sectionSpacing}
								options={CMS_PAGE_SECTION_SPACING}
								onChange={(nextValue) =>
									setValue((current) => ({
										...current,
										sectionSpacing: nextValue,
									}))
								}
							/>
						</div>

						<div className="flex items-center justify-between rounded-2xl border border-border/70 bg-secondary/40 px-5 py-4">
							<div>
								<p className="text-sm font-medium">{t.sectionSidebar}</p>
								<p className="text-xs text-muted-foreground">
									{t.sectionSidebarHelp}
								</p>
							</div>
							<Switch
								checked={value.showSectionNav}
								onCheckedChange={(checked) =>
									setValue((current) => ({
										...current,
										showSectionNav: checked,
									}))
								}
							/>
						</div>
					</section>
				</CardContent>
			</Card>

			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="text-2xl font-semibold">{t.sections}</h2>
						<p className="text-sm text-muted-foreground">
							{t.sectionsHelp}
						</p>
					</div>

					<Button variant="outline" onClick={addSection}>
						<Plus className="mr-2 size-4" />
						{t.addSection}
					</Button>
				</div>

				{value.sections.map((section, index) => (
					<Card
						key={index}
						className="overflow-hidden border-border/70"
					>
						<CardHeader className="bg-secondary/30">
							<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
								<div className="flex items-center gap-3">
									<div className="rounded-full border border-border/70 bg-card p-2">
										<GripVertical className="size-4 text-muted-foreground" />
									</div>
									<div>
										<CardTitle className="text-lg">
											{t.sectionNumber} {index + 1}
										</CardTitle>
										<CardDescription>
											{t.sectionHelp}
										</CardDescription>
									</div>
								</div>

								<div className="flex flex-wrap gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => moveSection(index, -1)}
										disabled={index === 0}
									>
										{t.up}
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => moveSection(index, 1)}
										disabled={index === value.sections.length - 1}
									>
										{t.down}
									</Button>
									<Button
										variant="destructive"
										size="sm"
										onClick={() => removeSection(index)}
										disabled={value.sections.length === 1}
									>
										<Trash2 className="mr-2 size-4" />
										{t.remove}
									</Button>
								</div>
							</div>
						</CardHeader>

						<CardContent className="space-y-5 pt-6">
							<div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_0.9fr_0.9fr]">
								<div className="space-y-2">
									<Label>{t.internalName}</Label>
									<Input
										value={section.internalName}
										onChange={(event) =>
											updateSection(index, {
												internalName: event.target.value,
											})
										}
									/>
								</div>
								<div className="space-y-2">
									<Label>{t.heading}</Label>
									<Input
										value={section.heading}
										onChange={(event) =>
											updateSection(index, { heading: event.target.value })
										}
									/>
								</div>
								<BuilderSelect
									label={t.template}
									value={section.template}
									options={CMS_SECTION_TEMPLATES}
									onChange={(nextValue) =>
										updateSection(index, { template: nextValue })
									}
								/>
								<div className="flex items-end justify-between rounded-xl border border-border/70 bg-secondary/40 px-4 py-3">
									<div>
										<p className="text-sm font-medium">{t.visible}</p>
										<p className="text-xs text-muted-foreground">
											{t.visibleHelp}
										</p>
									</div>
									<Switch
										checked={section.isVisible}
										onCheckedChange={(checked) =>
											updateSection(index, { isVisible: checked })
										}
									/>
								</div>
							</div>

							<Editor
								apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
								value={section.bodyHtml}
								onEditorChange={(content) =>
									updateSection(index, { bodyHtml: content })
								}
								init={{
									height: 420,
									menubar: true,
									plugins: [
										'lists',
										'link',
										'image',
										'table',
										'code',
										'blockquote',
										'media',
										'fullscreen',
									],
									toolbar:
										'undo redo | blocks | bold italic underline strikethrough | alignleft aligncenter alignright | bullist numlist outdent indent | link image media table | blockquote code fullscreen',
									automatic_uploads: true,
									images_file_types: 'jpg,jpeg,png,gif,webp',
									images_upload_handler: async (blobInfo) => {
										const blob = blobInfo.blob()
										const file = new File(
											[blob],
											blobInfo.filename() || 'cms-page-image.png',
											{ type: blob.type || 'image/png' }
										)
										return uploadCmsPageImage(file)
									},
								}}
							/>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	)
}

function BuilderSelect<T extends string>({
	label,
	value,
	options,
	onChange,
}: {
	label: string
	value: T
	options: readonly T[]
	onChange: (value: T) => void
}) {
	return (
		<div className="space-y-2">
			<Label>{label}</Label>
			<Select value={value} onValueChange={(nextValue) => onChange(nextValue as T)}>
				<SelectTrigger className="w-full">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{options.map((option) => (
						<SelectItem key={option} value={option}>
							{option}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	)
}
