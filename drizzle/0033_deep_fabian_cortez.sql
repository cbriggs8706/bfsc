ALTER TABLE "kiosk_person_positions" RENAME TO "kiosk_person_callings";--> statement-breakpoint
ALTER TABLE "positions" RENAME TO "callings";--> statement-breakpoint
ALTER TABLE "kiosk_person_callings" RENAME COLUMN "position_id" TO "calling_id";--> statement-breakpoint
ALTER TABLE "kiosk_person_callings" DROP CONSTRAINT "kiosk_person_positions_person_id_position_id_unique";--> statement-breakpoint
ALTER TABLE "kiosk_person_callings" DROP CONSTRAINT "kiosk_person_positions_person_id_kiosk_people_id_fk";
--> statement-breakpoint
ALTER TABLE "kiosk_person_callings" DROP CONSTRAINT "kiosk_person_positions_position_id_positions_id_fk";
--> statement-breakpoint
ALTER TABLE "kiosk_person_callings" ADD CONSTRAINT "kiosk_person_callings_person_id_kiosk_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."kiosk_people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kiosk_person_callings" ADD CONSTRAINT "kiosk_person_callings_calling_id_callings_id_fk" FOREIGN KEY ("calling_id") REFERENCES "public"."callings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kiosk_person_callings" ADD CONSTRAINT "kiosk_person_callings_person_id_calling_id_unique" UNIQUE("person_id","calling_id");