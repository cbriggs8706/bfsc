ALTER TABLE "kiosk_people"
ADD COLUMN "research_specialties" text[] NOT NULL DEFAULT '{}'::text[];
