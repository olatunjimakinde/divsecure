-- Add category column to security_messages table
ALTER TABLE "public"."security_messages" ADD COLUMN "category" text DEFAULT 'General';

-- Update existing rows to have a default category
UPDATE "public"."security_messages" SET "category" = 'General' WHERE "category" IS NULL;
