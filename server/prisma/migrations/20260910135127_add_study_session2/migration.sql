/*
  Warnings:

  - You are about to drop the column `startTime` on the `StudySession` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "StudySession" DROP COLUMN "startTime",
ADD COLUMN     "startAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
