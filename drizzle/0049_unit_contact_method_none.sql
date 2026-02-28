ALTER TABLE "unit_contacts"
ALTER COLUMN "preferred_contact_method" SET DEFAULT 'none';

ALTER TABLE "unit_contacts"
DROP CONSTRAINT IF EXISTS "unit_contact_method_ck";

ALTER TABLE "unit_contacts"
ADD CONSTRAINT "unit_contact_method_ck"
CHECK ("unit_contacts"."preferred_contact_method" in ('none', 'phone', 'email', 'text'));
