-- Add unique constraint to Document.id to allow foreign key references
ALTER TABLE "Document" ADD CONSTRAINT "Document_id_unique" UNIQUE ("id");

-- Now try adding the memoryId foreign key to Chat again
ALTER TABLE "Chat" DROP COLUMN IF EXISTS "memoryId";
ALTER TABLE "Chat" ADD COLUMN "memoryId" uuid REFERENCES "Document"("id");

-- Create indexes again in case they're missing
DROP INDEX IF EXISTS "memory_idx";
DROP INDEX IF EXISTS "chat_user_idx";
DROP INDEX IF EXISTS "document_user_idx";
DROP INDEX IF EXISTS "document_kind_idx";

CREATE INDEX "memory_idx" ON "Chat" ("memoryId");
CREATE INDEX "chat_user_idx" ON "Chat" ("userId");
CREATE INDEX "document_user_idx" ON "Document" ("userId");
CREATE INDEX "document_kind_idx" ON "Document" ("kind"); 