CREATE TABLE "resource_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resource_id" uuid NOT NULL,
	"blocks_resource_id" uuid NOT NULL,
	CONSTRAINT "resource_blocks_no_self_ck" CHECK ("resource_blocks"."resource_id" <> "resource_blocks"."blocks_resource_id")
);
--> statement-breakpoint
ALTER TABLE "reservations" RENAME COLUMN "purpose" TO "notes";--> statement-breakpoint
ALTER TABLE "resources" DROP CONSTRAINT "resources_type_ck";--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "attendee_count" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "assistance_level" varchar(20) DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "capacity" integer;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "required_items" text;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "prep" text;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "link" text;--> statement-breakpoint
ALTER TABLE "resource_blocks" ADD CONSTRAINT "resource_blocks_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_blocks" ADD CONSTRAINT "resource_blocks_blocks_resource_id_resources_id_fk" FOREIGN KEY ("blocks_resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "resource_blocks_unique_idx" ON "resource_blocks" USING btree ("resource_id","blocks_resource_id");--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_assistance_level_ck" CHECK ("reservations"."assistance_level" in ('none','startup','full'));--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_attendee_count_ck" CHECK ("reservations"."attendee_count" >= 1);--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_capacity_ck" CHECK ("resources"."capacity" is null or "resources"."capacity" > 0);--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_type_ck" CHECK ("resources"."type" in ('equipment','room','booth', 'activity'));