CREATE TABLE IF NOT EXISTS "cms_page" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_key" varchar(100) NOT NULL,
	"locale" varchar(10) NOT NULL,
	"title" varchar(255) NOT NULL,
	"title_i18n" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"slug" varchar(255) NOT NULL,
	"menu_label" varchar(255),
	"menu_label_i18n" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"icon_name" varchar(100),
	"excerpt" text,
	"excerpt_i18n" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"seo_title" varchar(255),
	"seo_description" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"allowed_roles" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"show_in_menu" boolean DEFAULT true NOT NULL,
	"menu_targets" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cta_buttons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cta_buttons_i18n" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"max_width" varchar(24) DEFAULT 'standard' NOT NULL,
	"hero_style" varchar(24) DEFAULT 'banner' NOT NULL,
	"background_style" varchar(24) DEFAULT 'subtle' NOT NULL,
	"section_spacing" varchar(24) DEFAULT 'comfortable' NOT NULL,
	"show_section_nav" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "cms_page"
ADD COLUMN IF NOT EXISTS "icon_name" varchar(100);

ALTER TABLE "cms_page"
ADD COLUMN IF NOT EXISTS "menu_targets" jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE "cms_page"
ADD COLUMN IF NOT EXISTS "cta_buttons" jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE "cms_page"
ADD COLUMN IF NOT EXISTS "title_i18n" jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE "cms_page"
ADD COLUMN IF NOT EXISTS "menu_label_i18n" jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE "cms_page"
ADD COLUMN IF NOT EXISTS "excerpt_i18n" jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE "cms_page"
ADD COLUMN IF NOT EXISTS "cta_buttons_i18n" jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS "cms_page_tenant_locale_slug_idx"
	ON "cms_page" ("tenant_key", "locale", "slug");

CREATE TABLE IF NOT EXISTS "cms_page_section" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"internal_name" varchar(255) NOT NULL,
	"internal_name_i18n" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"heading" varchar(255),
	"heading_i18n" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"kind" varchar(24) DEFAULT 'richText' NOT NULL,
	"template" varchar(24) DEFAULT 'default' NOT NULL,
	"body_html" text DEFAULT '' NOT NULL,
	"body_html_i18n" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cms_page_section_page_id_fk"
		FOREIGN KEY ("page_id")
		REFERENCES "cms_page"("id")
		ON DELETE cascade
);

CREATE INDEX IF NOT EXISTS "cms_page_section_page_position_idx"
	ON "cms_page_section" ("page_id", "position");

ALTER TABLE "cms_page_section"
ADD COLUMN IF NOT EXISTS "internal_name_i18n" jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE "cms_page_section"
ADD COLUMN IF NOT EXISTS "heading_i18n" jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE "cms_page_section"
ADD COLUMN IF NOT EXISTS "body_html_i18n" jsonb NOT NULL DEFAULT '{}'::jsonb;
