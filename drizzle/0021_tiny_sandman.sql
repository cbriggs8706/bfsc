CREATE TABLE "newsletter_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"is_confirmed" boolean DEFAULT false NOT NULL,
	"confirmed_at" timestamp with time zone,
	"confirm_token" text NOT NULL,
	"unsubscribed_at" timestamp with time zone,
	"source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "learning_courses" RENAME COLUMN "cover_image_path" TO "badge_image_path";--> statement-breakpoint
ALTER TABLE "learning_courses" ALTER COLUMN "is_published" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "learning_courses" ADD COLUMN "content_version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_certificates" ADD COLUMN "course_version" integer;--> statement-breakpoint
ALTER TABLE "user_certificates" ADD COLUMN "external_certificate_version" text;--> statement-breakpoint
CREATE INDEX "newsletter_email_unique" ON "newsletter_subscribers" USING btree ("email");