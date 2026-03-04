ALTER TABLE "newsletter_email_sends"
ADD COLUMN "recipient_emails_sample" jsonb NOT NULL DEFAULT '[]'::jsonb;
