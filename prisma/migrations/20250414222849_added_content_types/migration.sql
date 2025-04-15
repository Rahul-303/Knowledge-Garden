/*
  Warnings:

  - Added the required column `contentType` to the `Content` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('twitter', 'youtube', 'spotify', 'medium', 'reddit', 'generic');

-- AlterTable
ALTER TABLE "Content" ADD COLUMN     "contentType" "ContentType" NOT NULL;
