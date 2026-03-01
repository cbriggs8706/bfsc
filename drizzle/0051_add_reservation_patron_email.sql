ALTER TABLE "reservations"
ADD COLUMN IF NOT EXISTS "patron_email" text;
