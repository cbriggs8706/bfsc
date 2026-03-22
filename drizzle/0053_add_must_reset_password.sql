ALTER TABLE "public.user"
ADD COLUMN "must_reset_password" boolean DEFAULT false NOT NULL;
