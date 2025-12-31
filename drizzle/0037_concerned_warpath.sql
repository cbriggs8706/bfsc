CREATE TYPE "public"."shift_type" AS ENUM('regular', 'appointment');--> statement-breakpoint
ALTER TABLE "weekly_shifts" ADD COLUMN "type" "shift_type" DEFAULT 'regular' NOT NULL;--> statement-breakpoint
CREATE INDEX "weekly_shifts_weekday_type_idx" ON "weekly_shifts" USING btree ("weekday","type","is_active");--> statement-breakpoint
ALTER TABLE "weekly_shifts" ADD CONSTRAINT "weekly_shifts_time_order_ck" CHECK ("weekly_shifts"."end_time" > "weekly_shifts"."start_time");