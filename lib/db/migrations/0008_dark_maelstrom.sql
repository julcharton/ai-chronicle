CREATE TABLE IF NOT EXISTS "Memory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"userId" uuid NOT NULL,
	"metadata" json
);
--> statement-breakpoint
ALTER TABLE "Document" DROP CONSTRAINT "document_id_unique";--> statement-breakpoint
ALTER TABLE "Chat" DROP CONSTRAINT "Chat_memoryId_Document_id_fk";
--> statement-breakpoint
ALTER TABLE "Suggestion" DROP CONSTRAINT "Suggestion_documentId_documentCreatedAt_Document_id_createdAt_fk";
--> statement-breakpoint
ALTER TABLE "Document" DROP CONSTRAINT "Document_id_createdAt_pk";--> statement-breakpoint
ALTER TABLE "Document" ADD PRIMARY KEY ("id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Memory" ADD CONSTRAINT "Memory_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "memory_user_idx" ON "Memory" USING btree ("userId");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Chat" ADD CONSTRAINT "Chat_memoryId_Memory_id_fk" FOREIGN KEY ("memoryId") REFERENCES "public"."Memory"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_documentId_Document_id_fk" FOREIGN KEY ("documentId") REFERENCES "public"."Document"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "document_createdAt_idx" ON "Document" USING btree ("createdAt");--> statement-breakpoint
ALTER TABLE "Suggestion" DROP COLUMN IF EXISTS "documentCreatedAt";