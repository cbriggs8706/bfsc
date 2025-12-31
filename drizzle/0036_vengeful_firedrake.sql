CREATE TABLE "public.password_reset_throttle" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"key" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"windowStart" timestamp with time zone NOT NULL,
	"windowEnds" timestamp with time zone NOT NULL
);
