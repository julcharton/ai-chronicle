-- Fix the 'kind' column name in Document table (it was incorrectly named 'text')
ALTER TABLE "Document" RENAME COLUMN "text" TO "kind";

ALTER TABLE "Document" ADD CONSTRAINT "Document_id_unique" UNIQUE ("id");

-- Add updatedAt column to Document table
ALTER TABLE "Document" ADD COLUMN "updatedAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add metadata JSON column to Document table
ALTER TABLE "Document" ADD COLUMN "metadata" jsonb;

-- Add memoryId column to Chat table to establish the relationship with memories
ALTER TABLE "Chat" ADD COLUMN "memoryId" uuid REFERENCES "Document"("id");

-- Create indexes for better query performance
CREATE INDEX "memory_idx" ON "Chat" ("memoryId");
CREATE INDEX "chat_user_idx" ON "Chat" ("userId");
CREATE INDEX "document_user_idx" ON "Document" ("userId");
CREATE INDEX "document_kind_idx" ON "Document" ("kind");

-- Update existing documents to have updatedAt equal to createdAt for consistency
UPDATE "Document" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL; 