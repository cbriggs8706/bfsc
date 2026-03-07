import {
	boolean,
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core'

export const cmsPage = pgTable(
	'cms_page',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		tenantKey: varchar('tenant_key', { length: 100 }).notNull(),
		locale: varchar('locale', { length: 10 }).notNull(),
		title: varchar('title', { length: 255 }).notNull(),
		titleI18n: jsonb('title_i18n').$type<Record<string, string>>().notNull().default({}),
		slug: varchar('slug', { length: 255 }).notNull(),
		menuLabel: varchar('menu_label', { length: 255 }),
		menuLabelI18n: jsonb('menu_label_i18n')
			.$type<Record<string, string>>()
			.notNull()
			.default({}),
		iconName: varchar('icon_name', { length: 100 }),
		excerpt: text('excerpt'),
		excerptI18n: jsonb('excerpt_i18n').$type<Record<string, string>>().notNull().default({}),
		seoTitle: varchar('seo_title', { length: 255 }),
		seoDescription: text('seo_description'),
		isPublic: boolean('is_public').notNull().default(false),
		allowedRoles: jsonb('allowed_roles').$type<string[]>().notNull().default([]),
		showInMenu: boolean('show_in_menu').notNull().default(true),
		menuTargets: jsonb('menu_targets').$type<string[]>().notNull().default([]),
		ctaButtons: jsonb('cta_buttons')
			.$type<
				{ label: string; href: string; variant: string; openInNewTab: boolean }[]
			>()
			.notNull()
			.default([]),
		ctaButtonsI18n: jsonb('cta_buttons_i18n')
			.$type<
				Record<
					string,
					{ label: string; href: string; variant: string; openInNewTab: boolean }[]
				>
			>()
			.notNull()
			.default({}),
		maxWidth: varchar('max_width', { length: 24 }).notNull().default('standard'),
		heroStyle: varchar('hero_style', { length: 24 }).notNull().default('banner'),
		backgroundStyle: varchar('background_style', { length: 24 })
			.notNull()
			.default('subtle'),
		sectionSpacing: varchar('section_spacing', { length: 24 })
			.notNull()
			.default('comfortable'),
		showSectionNav: boolean('show_section_nav').notNull().default(false),
		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		tenantLocaleSlugIdx: index('cms_page_tenant_locale_slug_idx').on(
			table.tenantKey,
			table.locale,
			table.slug
		),
	})
)

export const cmsPageSection = pgTable(
	'cms_page_section',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		pageId: uuid('page_id')
			.notNull()
			.references(() => cmsPage.id, { onDelete: 'cascade' }),
		position: integer('position').notNull().default(0),
		internalName: varchar('internal_name', { length: 255 }).notNull(),
		internalNameI18n: jsonb('internal_name_i18n')
			.$type<Record<string, string>>()
			.notNull()
			.default({}),
		heading: varchar('heading', { length: 255 }),
		headingI18n: jsonb('heading_i18n').$type<Record<string, string>>().notNull().default({}),
		kind: varchar('kind', { length: 24 }).notNull().default('richText'),
		template: varchar('template', { length: 24 }).notNull().default('default'),
		bodyHtml: text('body_html').notNull().default(''),
		bodyHtmlI18n: jsonb('body_html_i18n').$type<Record<string, string>>().notNull().default({}),
		isVisible: boolean('is_visible').notNull().default(true),
		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		pagePositionIdx: index('cms_page_section_page_position_idx').on(
			table.pageId,
			table.position
		),
	})
)
