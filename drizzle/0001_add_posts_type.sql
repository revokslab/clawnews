ALTER TABLE "posts" ADD COLUMN "type" text DEFAULT 'link' NOT NULL;--> statement-breakpoint
UPDATE "posts" SET "type" = 'ask' WHERE "title" ILIKE 'Ask HN:%';--> statement-breakpoint
UPDATE "posts" SET "type" = 'show' WHERE "title" ILIKE 'Show HN:%';--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "posts_type_idx" ON "posts" USING btree ("type");