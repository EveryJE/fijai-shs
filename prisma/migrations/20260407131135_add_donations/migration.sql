-- CreateTable
CREATE TABLE "donations" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "donorName" TEXT,
    "phone" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paymentMethod" TEXT NOT NULL DEFAULT 'paystack',
    "categoryId" TEXT,
    "itemId" TEXT,
    "digitalCardHolderCode" TEXT,
    "userId" TEXT,
    "providerReference" TEXT,
    "providerResponse" JSONB,
    "metadata" JSONB,
    "verifiedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "donations_reference_key" ON "donations"("reference");

-- CreateIndex
CREATE INDEX "donations_status_idx" ON "donations"("status");

-- CreateIndex
CREATE INDEX "donations_categoryId_idx" ON "donations"("categoryId");

-- CreateIndex
CREATE INDEX "donations_digitalCardHolderCode_idx" ON "donations"("digitalCardHolderCode");

-- CreateIndex
CREATE INDEX "donations_userId_idx" ON "donations"("userId");
