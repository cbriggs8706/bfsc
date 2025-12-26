ALTER TABLE "reservations" RENAME TO "reservation";--> statement-breakpoint
ALTER TABLE "resources" RENAME TO "resource";--> statement-breakpoint
ALTER TABLE "resource_blocks" RENAME TO "resource_block";--> statement-breakpoint
ALTER TABLE "resource_block" RENAME COLUMN "blocks_resource_id" TO "block_resource_id";--> statement-breakpoint
ALTER TABLE "reservation" DROP CONSTRAINT "reservations_status_ck";--> statement-breakpoint
ALTER TABLE "reservation" DROP CONSTRAINT "reservations_assistance_level_ck";--> statement-breakpoint
ALTER TABLE "reservation" DROP CONSTRAINT "reservations_attendee_count_ck";--> statement-breakpoint
ALTER TABLE "resource_block" DROP CONSTRAINT "resource_blocks_no_self_ck";--> statement-breakpoint
ALTER TABLE "resource" DROP CONSTRAINT "resources_type_ck";--> statement-breakpoint
ALTER TABLE "resource" DROP CONSTRAINT "resources_capacity_ck";--> statement-breakpoint
ALTER TABLE "reservation" DROP CONSTRAINT "reservations_resource_id_resources_id_fk";
--> statement-breakpoint
ALTER TABLE "reservation" DROP CONSTRAINT "reservations_user_id_public.user_id_fk";
--> statement-breakpoint
ALTER TABLE "reservation" DROP CONSTRAINT "reservations_approved_by_user_id_public.user_id_fk";
--> statement-breakpoint
ALTER TABLE "reservation" DROP CONSTRAINT "reservations_assigned_consultant_id_public.user_id_fk";
--> statement-breakpoint
ALTER TABLE "resource_block" DROP CONSTRAINT "resource_blocks_resource_id_resources_id_fk";
--> statement-breakpoint
ALTER TABLE "resource_block" DROP CONSTRAINT "resource_blocks_blocks_resource_id_resources_id_fk";
--> statement-breakpoint
DROP INDEX "reservations_resource_time_idx";--> statement-breakpoint
DROP INDEX "resource_blocks_unique_idx";--> statement-breakpoint
DROP INDEX "resources_type_idx";--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_resource_id_resource_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resource"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_user_id_public.user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."public.user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_approved_by_user_id_public.user_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."public.user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_assigned_consultant_id_public.user_id_fk" FOREIGN KEY ("assigned_consultant_id") REFERENCES "public"."public.user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_block" ADD CONSTRAINT "resource_block_resource_id_resource_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resource"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_block" ADD CONSTRAINT "resource_block_block_resource_id_resource_id_fk" FOREIGN KEY ("block_resource_id") REFERENCES "public"."resource"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reservation_resource_time_idx" ON "reservation" USING btree ("resource_id","start_time","end_time");--> statement-breakpoint
CREATE UNIQUE INDEX "resource_block_unique_idx" ON "resource_block" USING btree ("resource_id","block_resource_id");--> statement-breakpoint
CREATE INDEX "resource_type_idx" ON "resource" USING btree ("type");--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_status_ck" CHECK ("reservation"."status" in ('pending','approved','denied','cancelled'));--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_assistance_level_ck" CHECK ("reservation"."assistance_level" in ('none','startup','full'));--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_attendee_count_ck" CHECK ("reservation"."attendee_count" >= 1);--> statement-breakpoint
ALTER TABLE "resource_block" ADD CONSTRAINT "resource_block_no_self_ck" CHECK ("resource_block"."resource_id" <> "resource_block"."block_resource_id");--> statement-breakpoint
ALTER TABLE "resource" ADD CONSTRAINT "resource_type_ck" CHECK ("resource"."type" in ('equipment','room','booth', 'activity'));--> statement-breakpoint
ALTER TABLE "resource" ADD CONSTRAINT "resource_capacity_ck" CHECK ("resource"."capacity" is null or "resource"."capacity" > 0);