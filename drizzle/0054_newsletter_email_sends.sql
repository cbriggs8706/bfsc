CREATE TABLE "newsletter_email_sends" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_user_id" uuid,
	"sender_email" text NOT NULL,
	"send_mode" text NOT NULL,
	"selected_month" text,
	"subject" text NOT NULL,
	"recipient_count" integer NOT NULL,
	"attachment_names" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "newsletter_email_sends_mode_ck" CHECK ("newsletter_email_sends"."send_mode" in ('test', 'full'))
);
--> statement-breakpoint
ALTER TABLE "newsletter_email_sends" ADD CONSTRAINT "newsletter_email_sends_sender_user_id_public.user_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."public.user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "newsletter_email_sends_created_at_idx" ON "newsletter_email_sends" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX "newsletter_email_sends_sender_user_id_idx" ON "newsletter_email_sends" USING btree ("sender_user_id");
