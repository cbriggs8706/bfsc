CREATE TABLE "shift_recurrences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shift_id" uuid NOT NULL,
	"label" varchar(50) NOT NULL,
	"week_of_month" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "shift_recurrences_week_range_ck" CHECK ("shift_recurrences"."week_of_month" is null or ("shift_recurrences"."week_of_month" between 1 and 5))
);
--> statement-breakpoint
ALTER TABLE "shift_assignments" DROP CONSTRAINT "shift_assignments_shift_id_weekly_shifts_id_fk";
--> statement-breakpoint
ALTER TABLE "shift_assignments" ADD COLUMN "shift_recurrence_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "shift_recurrences" ADD CONSTRAINT "shift_recurrences_shift_id_weekly_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."weekly_shifts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "shift_recurrences_shift_idx" ON "shift_recurrences" USING btree ("shift_id");--> statement-breakpoint
CREATE UNIQUE INDEX "shift_recurrences_shift_label_uq" ON "shift_recurrences" USING btree ("shift_id","label");--> statement-breakpoint
CREATE UNIQUE INDEX "shift_recurrences_shift_week_uq" ON "shift_recurrences" USING btree ("shift_id","week_of_month") WHERE "shift_recurrences"."week_of_month" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "shift_recurrences_shift_everyweek_uq" ON "shift_recurrences" USING btree ("shift_id") WHERE "shift_recurrences"."week_of_month" is null;--> statement-breakpoint
ALTER TABLE "shift_assignments" ADD CONSTRAINT "shift_assignments_shift_recurrence_id_shift_recurrences_id_fk" FOREIGN KEY ("shift_recurrence_id") REFERENCES "public"."shift_recurrences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "shift_assignments_recurrence_idx" ON "shift_assignments" USING btree ("shift_recurrence_id");--> statement-breakpoint
CREATE INDEX "weekly_shifts_weekday_idx" ON "weekly_shifts" USING btree ("weekday");--> statement-breakpoint
ALTER TABLE "shift_assignments" DROP COLUMN "shift_id";--> statement-breakpoint
ALTER TABLE "shift_assignments" DROP COLUMN "week_of_month";