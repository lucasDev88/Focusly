-- DropForeignKey
ALTER TABLE "Goal" DROP CONSTRAINT "Goal_subjectId_fkey";

-- AlterTable
ALTER TABLE "Goal" ALTER COLUMN "subjectId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
