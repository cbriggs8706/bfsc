ALTER TABLE "group_schedule_events" ADD COLUMN "primary_assistant_user_id" uuid;
--> statement-breakpoint
ALTER TABLE "group_schedule_events" ADD COLUMN "secondary_assistant_user_id" uuid;
--> statement-breakpoint
ALTER TABLE "group_schedule_events" ADD CONSTRAINT "group_schedule_events_primary_assistant_user_id_public.user_id_fk" FOREIGN KEY ("primary_assistant_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "group_schedule_events" ADD CONSTRAINT "group_schedule_events_secondary_assistant_user_id_public.user_id_fk" FOREIGN KEY ("secondary_assistant_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "group_schedule_events_primary_assistant_idx" ON "group_schedule_events" USING btree ("primary_assistant_user_id");
--> statement-breakpoint
CREATE INDEX "group_schedule_events_secondary_assistant_idx" ON "group_schedule_events" USING btree ("secondary_assistant_user_id");
