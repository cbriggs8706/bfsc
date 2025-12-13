ALTER TABLE "case_comments" ADD COLUMN "reply_to_comment_id" uuid;--> statement-breakpoint
ALTER TABLE "case_comments" ADD COLUMN "edited_at" timestamp with time zone;