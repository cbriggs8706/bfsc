CREATE TYPE "public"."sub_request_status" AS ENUM('open', 'awaiting_request_confirmation', 'accepted', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."sub_request_type" AS ENUM('substitute', 'trade');--> statement-breakpoint
ALTER TABLE "shift_sub_requests" ALTER COLUMN "type" SET DATA TYPE "public"."sub_request_type" USING "type"::"public"."sub_request_type";--> statement-breakpoint
ALTER TABLE "shift_sub_requests" ALTER COLUMN "status" SET DEFAULT 'open'::"public"."sub_request_status";--> statement-breakpoint
ALTER TABLE "shift_sub_requests" ALTER COLUMN "status" SET DATA TYPE "public"."sub_request_status" USING "status"::"public"."sub_request_status";