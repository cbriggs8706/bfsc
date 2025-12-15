DROP INDEX "newsletter_post_locale_idx";--> statement-breakpoint
ALTER TABLE "newsletter_translations" ALTER COLUMN "content" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "newsletter_translations" ADD CONSTRAINT "newsletter_post_locale_unique" UNIQUE("post_id","locale");