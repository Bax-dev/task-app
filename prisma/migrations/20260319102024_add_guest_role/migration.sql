-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'GUEST';

-- AlterEnum
ALTER TYPE "TaskStatus" ADD VALUE 'REJECTED';

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "rejectionReason" TEXT;
