CREATE TABLE "app_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"time_format" varchar(20) DEFAULT 'h:mm a' NOT NULL,
	"use_24_hour_clock" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_settings_time_format_ck" CHECK ("app_settings"."time_format" in ('h:mm a','hh:mm a','H:mm','HH:mm'))
);
