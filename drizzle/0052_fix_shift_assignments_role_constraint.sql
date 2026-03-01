-- Normalize historical role values and enforce the modern role set.
-- Safe to run more than once.

ALTER TABLE "shift_assignments"
DROP CONSTRAINT IF EXISTS "shift_assignments_role_ck";

UPDATE "shift_assignments"
SET "assignment_role" = 'worker'
WHERE "assignment_role" = 'helper';

UPDATE "shift_assignments"
SET "assignment_role" = 'shift_lead'
WHERE "assignment_role" = 'lead';

-- Normalize additional legacy/variant spellings.
UPDATE "shift_assignments"
SET "assignment_role" = CASE
	WHEN lower(trim("assignment_role")) IN ('worker', 'workers', 'helper', 'helpers') THEN 'worker'
	WHEN lower(trim("assignment_role")) IN ('shift_lead', 'shift lead', 'lead', 'leader', 'shiftleader', 'shift_leader') THEN 'shift_lead'
	WHEN lower(trim("assignment_role")) IN ('trainer', 'trainers', 'training') THEN 'trainer'
	ELSE 'worker'
END
WHERE "assignment_role" IS NULL
	OR "assignment_role" NOT IN ('worker', 'shift_lead', 'trainer')
	OR "assignment_role" <> trim("assignment_role");

ALTER TABLE "shift_assignments"
ALTER COLUMN "assignment_role" SET DEFAULT 'worker';

ALTER TABLE "shift_assignments"
ADD CONSTRAINT "shift_assignments_role_ck"
CHECK ("assignment_role" IN ('worker', 'shift_lead', 'trainer'));
