-- First, rename Message_v2 to Message_temp (temporary name to avoid conflicts)
ALTER TABLE "Message_v2" RENAME TO "Message_temp";
--> statement-breakpoint

-- Then rename Vote_v2 to Vote_temp
ALTER TABLE "Vote_v2" RENAME TO "Vote_temp";
--> statement-breakpoint

-- Drop the old tables
DROP TABLE IF EXISTS "Message" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "Vote" CASCADE;
--> statement-breakpoint

-- Now rename the temp tables to their final names
ALTER TABLE "Message_temp" RENAME TO "Message";
--> statement-breakpoint
ALTER TABLE "Vote_temp" RENAME TO "Vote";
--> statement-breakpoint

-- Update foreign key references in Vote table
ALTER TABLE "Vote" DROP CONSTRAINT IF EXISTS "Vote_v2_messageId_Message_v2_id_fk";
--> statement-breakpoint
ALTER TABLE "Vote" DROP CONSTRAINT IF EXISTS "Vote_v2_chatId_Chat_id_fk";
--> statement-breakpoint

-- Re-add the foreign key constraints with the new table names
DO $$ BEGIN
 ALTER TABLE "Vote" ADD CONSTRAINT "Vote_messageId_Message_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."Message"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Vote" ADD CONSTRAINT "Vote_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Rename the Vote_v2 primary key constraint to match the new table name
ALTER TABLE "Vote" RENAME CONSTRAINT "Vote_v2_chatId_messageId_pk" TO "Vote_chatId_messageId_pk";
--> statement-breakpoint