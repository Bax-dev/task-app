-- Replace per-task overdue dedupe with per-(task, user, local-day) dedupe.
ALTER TABLE "Task" DROP COLUMN IF EXISTS "lastOverdueReminderAt";

ALTER TABLE "User" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'UTC';

CREATE TABLE "TaskOverdueReminder" (
  "id"         UUID         NOT NULL,
  "taskId"     UUID         NOT NULL,
  "userId"     UUID         NOT NULL,
  "sentOnDate" TEXT         NOT NULL,
  "sentAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TaskOverdueReminder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TaskOverdueReminder_taskId_userId_sentOnDate_key"
  ON "TaskOverdueReminder" ("taskId", "userId", "sentOnDate");

CREATE INDEX "TaskOverdueReminder_userId_idx"
  ON "TaskOverdueReminder" ("userId");

ALTER TABLE "TaskOverdueReminder"
  ADD CONSTRAINT "TaskOverdueReminder_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TaskOverdueReminder"
  ADD CONSTRAINT "TaskOverdueReminder_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
