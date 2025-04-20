DO $$ BEGIN
 CREATE TYPE "public"."permission_type" AS ENUM('view', 'edit', 'delete', 'manage');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "MemoryPermission" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"memory_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"permission_type" "permission_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "is_admin" boolean DEFAULT false NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "MemoryPermission" ADD CONSTRAINT "MemoryPermission_memory_id_Memory_id_fk" FOREIGN KEY ("memory_id") REFERENCES "public"."Memory"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "MemoryPermission" ADD CONSTRAINT "MemoryPermission_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN IF EXISTS "role";