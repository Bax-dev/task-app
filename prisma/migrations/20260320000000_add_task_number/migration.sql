-- AlterTable: Add taskCounter to Organization
ALTER TABLE "Organization" ADD COLUMN "taskCounter" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: Add taskNumber to Task
ALTER TABLE "Task" ADD COLUMN "taskNumber" INTEGER;

-- Backfill existing tasks with sequential numbers per organization
WITH numbered_tasks AS (
  SELECT
    t."id",
    ROW_NUMBER() OVER (
      PARTITION BY s."organizationId"
      ORDER BY t."createdAt"
    ) AS rn,
    s."organizationId"
  FROM "Task" t
  JOIN "Project" p ON p."id" = t."projectId"
  JOIN "Space" s ON s."id" = p."spaceId"
)
UPDATE "Task"
SET "taskNumber" = numbered_tasks.rn
FROM numbered_tasks
WHERE "Task"."id" = numbered_tasks."id";

-- Update org counters to match
UPDATE "Organization"
SET "taskCounter" = COALESCE(sub.cnt, 0)
FROM (
  SELECT s."organizationId", COUNT(*) AS cnt
  FROM "Task" t
  JOIN "Project" p ON p."id" = t."projectId"
  JOIN "Space" s ON s."id" = p."spaceId"
  GROUP BY s."organizationId"
) sub
WHERE "Organization"."id" = sub."organizationId";

-- Set default for new tasks and make NOT NULL
ALTER TABLE "Task" ALTER COLUMN "taskNumber" SET NOT NULL;
ALTER TABLE "Task" ALTER COLUMN "taskNumber" SET DEFAULT 0;
