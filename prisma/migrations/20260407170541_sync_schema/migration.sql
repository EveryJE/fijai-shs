/*
  Warnings:

  - You are about to drop the column `categoryId` on the `donations` table. All the data in the column will be lost.
  - You are about to drop the column `digitalCardHolderCode` on the `donations` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `donations` table. All the data in the column will be lost.
  - You are about to drop the column `itemId` on the `donations` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `profiles` table. All the data in the column will be lost.
  - Added the required column `donorEmail` to the `donations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `eventId` to the `donations` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "donations_categoryId_idx";

-- DropIndex
DROP INDEX "donations_digitalCardHolderCode_idx";

-- DropIndex
DROP INDEX "profiles_username_key";

-- AlterTable
ALTER TABLE "donations" DROP COLUMN "categoryId",
DROP COLUMN "digitalCardHolderCode",
DROP COLUMN "email",
DROP COLUMN "itemId",
ADD COLUMN     "contactPersonId" TEXT,
ADD COLUMN     "digitalCardId" TEXT,
ADD COLUMN     "donatedAt" TIMESTAMP(3),
ADD COLUMN     "donationItemId" TEXT,
ADD COLUMN     "donorEmail" TEXT NOT NULL,
ADD COLUMN     "eventId" TEXT NOT NULL,
ADD COLUMN     "momentCaption" TEXT,
ADD COLUMN     "momentFileUrl" TEXT;

-- AlterTable
ALTER TABLE "profiles" DROP COLUMN "username",
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'admin';

-- CreateTable
CREATE TABLE "digital_cards" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "cardCode" TEXT NOT NULL,
    "holderName" TEXT NOT NULL,
    "email" TEXT,
    "profilePictureUrl" TEXT,
    "classYear" TEXT,
    "qrCodeUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "digital_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL DEFAULT '#730303',
    "secondaryColor" TEXT NOT NULL DEFAULT '#DAA520',
    "tertiaryColor" TEXT NOT NULL DEFAULT '#1B3A5C',
    "logoUrl" TEXT,
    "bankCode" TEXT,
    "bankName" TEXT,
    "accountNumber" TEXT,
    "accountName" TEXT,
    "subaccountCode" TEXT,
    "settlementBank" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donation_items" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "targetAmount" DECIMAL(12,2),
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_persons" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "uniqueCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "profilePictureUrl" TEXT,
    "classYear" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "metadata" JSONB,
    "qrCodeUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_persons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "digital_cards_cardCode_key" ON "digital_cards"("cardCode");

-- CreateIndex
CREATE INDEX "digital_cards_eventId_idx" ON "digital_cards"("eventId");

-- CreateIndex
CREATE INDEX "digital_cards_isActive_idx" ON "digital_cards"("isActive");

-- CreateIndex
CREATE INDEX "events_status_idx" ON "events"("status");

-- CreateIndex
CREATE INDEX "categories_eventId_idx" ON "categories"("eventId");

-- CreateIndex
CREATE INDEX "donation_items_categoryId_idx" ON "donation_items"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "contact_persons_uniqueCode_key" ON "contact_persons"("uniqueCode");

-- CreateIndex
CREATE INDEX "contact_persons_eventId_idx" ON "contact_persons"("eventId");

-- CreateIndex
CREATE INDEX "donations_eventId_idx" ON "donations"("eventId");

-- CreateIndex
CREATE INDEX "donations_contactPersonId_idx" ON "donations"("contactPersonId");

-- CreateIndex
CREATE INDEX "donations_digitalCardId_idx" ON "donations"("digitalCardId");

-- CreateIndex
CREATE INDEX "donations_donationItemId_idx" ON "donations"("donationItemId");

-- AddForeignKey
ALTER TABLE "digital_cards" ADD CONSTRAINT "digital_cards_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_contactPersonId_fkey" FOREIGN KEY ("contactPersonId") REFERENCES "contact_persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_digitalCardId_fkey" FOREIGN KEY ("digitalCardId") REFERENCES "digital_cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_donationItemId_fkey" FOREIGN KEY ("donationItemId") REFERENCES "donation_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donation_items" ADD CONSTRAINT "donation_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_persons" ADD CONSTRAINT "contact_persons_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
