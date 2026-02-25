ALTER TABLE "group_schedule_events" ALTER COLUMN "ends_at" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "group_schedule_events" DROP CONSTRAINT IF EXISTS "group_schedule_event_start_end_ck";
--> statement-breakpoint
ALTER TABLE "group_schedule_events" ADD CONSTRAINT "group_schedule_event_timing_ck" CHECK (
	(
		"group_schedule_events"."status" = 'tentative'
		and ("group_schedule_events"."ends_at" is null or "group_schedule_events"."ends_at" > "group_schedule_events"."starts_at")
	)
	or
	(
		"group_schedule_events"."status" <> 'tentative'
		and "group_schedule_events"."ends_at" is not null
		and "group_schedule_events"."ends_at" > "group_schedule_events"."starts_at"
	)
);
--> statement-breakpoint
CREATE TABLE "group_schedule_event_wards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"ward_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "group_schedule_event_wards" ADD CONSTRAINT "group_schedule_event_wards_event_id_group_schedule_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."group_schedule_events"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "group_schedule_event_wards" ADD CONSTRAINT "group_schedule_event_wards_ward_id_wards_id_fk" FOREIGN KEY ("ward_id") REFERENCES "public"."wards"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "group_schedule_event_wards_event_idx" ON "group_schedule_event_wards" USING btree ("event_id");
--> statement-breakpoint
CREATE INDEX "group_schedule_event_wards_ward_idx" ON "group_schedule_event_wards" USING btree ("ward_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "group_schedule_event_wards_unique_idx" ON "group_schedule_event_wards" USING btree ("event_id","ward_id");
--> statement-breakpoint
INSERT INTO "group_schedule_event_wards" ("event_id", "ward_id")
SELECT "id", "ward_id"
FROM "group_schedule_events"
WHERE "ward_id" IS NOT NULL;
