/*
  Warnings:

  - You are about to drop the column `role` on the `profiles` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[uniqueCode]` on the table `profiles` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "contact_persons" ADD COLUMN     "profileId" TEXT;

-- AlterTable
ALTER TABLE "digital_cards" ADD COLUMN     "profileId" TEXT;

-- AlterTable
ALTER TABLE "profiles" DROP COLUMN "role",
ADD COLUMN     "roles" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "uniqueCode" TEXT;

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "photoUrl" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_uniqueCode_key" ON "profiles"("uniqueCode");

-- AddForeignKey
ALTER TABLE "digital_cards" ADD CONSTRAINT "digital_cards_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_persons" ADD CONSTRAINT "contact_persons_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
