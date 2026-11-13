-- Idempotent: safe to re-run after a partial failure (`prisma migrate resolve` + deploy).
-- Nullable column with no default: metadata-only ALTER, no table rewrite. Existing rows read as NULL (sorted last).
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "boardPosition" DOUBLE PRECISION;

-- The composite index serves every lookup the single-column one did (same leading column).
CREATE INDEX IF NOT EXISTS "Task_boardColumnId_boardPosition_idx" ON "Task"("boardColumnId", "boardPosition");
DROP INDEX IF EXISTS "Task_boardColumnId_idx";
