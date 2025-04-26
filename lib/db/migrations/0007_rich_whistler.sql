-- First add the new columns to Document
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "kind" varchar DEFAULT 'text' NOT NULL;
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "metadata" json;

-- Remove old text column if exists
ALTER TABLE "Document" DROP COLUMN IF EXISTS "text";

-- Add unique constraint to Document.id BEFORE creating foreign keys
ALTER TABLE "Document" ADD CONSTRAINT "document_id_unique" UNIQUE("id");

-- Now add memoryId to Chat and create the foreign key
ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "memoryId" uuid;

-- Add foreign key reference now that unique constraint exists
DO $$ BEGIN
 ALTER TABLE "Chat" ADD CONSTRAINT "Chat_memoryId_Document_id_fk" FOREIGN KEY ("memoryId") REFERENCES "public"."Document"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS "memory_idx" ON "Chat" ("memoryId");
CREATE INDEX IF NOT EXISTS "chat_user_idx" ON "Chat" ("userId");
CREATE INDEX IF NOT EXISTS "document_user_idx" ON "Document" ("userId");
CREATE INDEX IF NOT EXISTS "document_kind_idx" ON "Document" ("kind");