-- CreateTable
CREATE TABLE "telegram_integrations" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "botToken" TEXT NOT NULL,
    "botUsername" TEXT,
    "webhookUrl" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "connectCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "telegram_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telegram_subscriptions" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "telegram_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "telegram_integrations_siteId_key" ON "telegram_integrations"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "telegram_integrations_connectCode_key" ON "telegram_integrations"("connectCode");

-- CreateIndex
CREATE INDEX "telegram_integrations_siteId_idx" ON "telegram_integrations"("siteId");

-- CreateIndex
CREATE INDEX "telegram_subscriptions_integrationId_idx" ON "telegram_subscriptions"("integrationId");

-- CreateIndex
CREATE UNIQUE INDEX "telegram_subscriptions_integrationId_chatId_key" ON "telegram_subscriptions"("integrationId", "chatId");

-- AddForeignKey
ALTER TABLE "telegram_integrations" ADD CONSTRAINT "telegram_integrations_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telegram_subscriptions" ADD CONSTRAINT "telegram_subscriptions_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "telegram_integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
