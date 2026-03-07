ALTER TABLE "cms_page"
ADD COLUMN IF NOT EXISTS "title_i18n" jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE "cms_page"
ADD COLUMN IF NOT EXISTS "menu_label_i18n" jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE "cms_page"
ADD COLUMN IF NOT EXISTS "excerpt_i18n" jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE "cms_page"
ADD COLUMN IF NOT EXISTS "cta_buttons_i18n" jsonb NOT NULL DEFAULT '{}'::jsonb;

UPDATE "cms_page"
SET
	"title_i18n" = jsonb_set(COALESCE("title_i18n", '{}'::jsonb), ARRAY[COALESCE("locale", 'en')], to_jsonb("title"), true),
	"menu_label_i18n" = jsonb_set(COALESCE("menu_label_i18n", '{}'::jsonb), ARRAY[COALESCE("locale", 'en')], to_jsonb(COALESCE("menu_label", '')), true),
	"excerpt_i18n" = jsonb_set(COALESCE("excerpt_i18n", '{}'::jsonb), ARRAY[COALESCE("locale", 'en')], to_jsonb(COALESCE("excerpt", '')), true),
	"cta_buttons_i18n" = CASE
		WHEN COALESCE(jsonb_typeof("cta_buttons_i18n"), 'null') = 'object'
		THEN jsonb_set(COALESCE("cta_buttons_i18n", '{}'::jsonb), ARRAY[COALESCE("locale", 'en')], COALESCE("cta_buttons", '[]'::jsonb), true)
		ELSE jsonb_build_object(COALESCE("locale", 'en'), COALESCE("cta_buttons", '[]'::jsonb))
	END;

ALTER TABLE "cms_page_section"
ADD COLUMN IF NOT EXISTS "internal_name_i18n" jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE "cms_page_section"
ADD COLUMN IF NOT EXISTS "heading_i18n" jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE "cms_page_section"
ADD COLUMN IF NOT EXISTS "body_html_i18n" jsonb NOT NULL DEFAULT '{}'::jsonb;

UPDATE "cms_page_section" s
SET
	"internal_name_i18n" = jsonb_set(
		COALESCE(s."internal_name_i18n", '{}'::jsonb),
		ARRAY[COALESCE(p."locale", 'en')],
		to_jsonb(s."internal_name"),
		true
	),
	"heading_i18n" = jsonb_set(
		COALESCE(s."heading_i18n", '{}'::jsonb),
		ARRAY[COALESCE(p."locale", 'en')],
		to_jsonb(COALESCE(s."heading", '')),
		true
	),
	"body_html_i18n" = jsonb_set(
		COALESCE(s."body_html_i18n", '{}'::jsonb),
		ARRAY[COALESCE(p."locale", 'en')],
		to_jsonb(COALESCE(s."body_html", '')),
		true
	)
FROM "cms_page" p
WHERE p."id" = s."page_id";
