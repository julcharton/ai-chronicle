ALTER TABLE "Memory" ALTER COLUMN "tags" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "Memory" ADD COLUMN "draft" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "Memory" ADD COLUMN "summary" text;--> statement-breakpoint
ALTER TABLE "Memory" DROP COLUMN IF EXISTS "source";