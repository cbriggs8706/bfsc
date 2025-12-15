CREATE TABLE "newsletter_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"label" text NOT NULL,
	CONSTRAINT "newsletter_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "newsletter_post_categories" (
	"post_id" uuid NOT NULL,
	"category_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_post_tags" (
	"post_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"featured_order" text,
	"cover_image_url" text,
	"published_at" timestamp,
	"author_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "newsletter_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "newsletter_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"label" text NOT NULL,
	CONSTRAINT "newsletter_tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "newsletter_translations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"content" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "library_items" ADD COLUMN "tags" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "newsletter_post_categories" ADD CONSTRAINT "newsletter_post_categories_post_id_newsletter_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."newsletter_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_post_categories" ADD CONSTRAINT "newsletter_post_categories_category_id_newsletter_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."newsletter_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_post_tags" ADD CONSTRAINT "newsletter_post_tags_post_id_newsletter_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."newsletter_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_post_tags" ADD CONSTRAINT "newsletter_post_tags_tag_id_newsletter_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."newsletter_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_translations" ADD CONSTRAINT "newsletter_translations_post_id_newsletter_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."newsletter_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "newsletter_slug_idx" ON "newsletter_posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "newsletter_published_idx" ON "newsletter_posts" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "newsletter_featured_idx" ON "newsletter_posts" USING btree ("featured");--> statement-breakpoint
CREATE INDEX "newsletter_post_locale_idx" ON "newsletter_translations" USING btree ("post_id","locale");