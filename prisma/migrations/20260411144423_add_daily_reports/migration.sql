-- CreateEnum
CREATE TYPE "Weekday" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'DAILY_REPORT_REMINDER';
ALTER TYPE "NotificationType" ADD VALUE 'DAILY_REPORT_SUBMITTED';

-- CreateTable
CREATE TABLE "DailyReportSchedule" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "time" TEXT NOT NULL DEFAULT '17:00',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "weekdays" "Weekday"[],
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyReportSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyReport" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "reportDate" DATE NOT NULL,
    "whatDid" TEXT NOT NULL,
    "blockers" TEXT,
    "goalTomorrow" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyReportSchedule_organizationId_key" ON "DailyReportSchedule"("organizationId");

-- CreateIndex
CREATE INDEX "DailyReportSchedule_createdById_idx" ON "DailyReportSchedule"("createdById");

-- CreateIndex
CREATE INDEX "DailyReport_organizationId_reportDate_idx" ON "DailyReport"("organizationId", "reportDate");

-- CreateIndex
CREATE INDEX "DailyReport_createdById_reportDate_idx" ON "DailyReport"("createdById", "reportDate");

-- CreateIndex
CREATE UNIQUE INDEX "DailyReport_organizationId_createdById_reportDate_key" ON "DailyReport"("organizationId", "createdById", "reportDate");

-- AddForeignKey
ALTER TABLE "DailyReportSchedule" ADD CONSTRAINT "DailyReportSchedule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyReportSchedule" ADD CONSTRAINT "DailyReportSchedule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyReport" ADD CONSTRAINT "DailyReport_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyReport" ADD CONSTRAINT "DailyReport_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
