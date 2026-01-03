/*
  Warnings:

  - A unique constraint covering the columns `[organizationId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "attachment" JSONB,
ADD COLUMN     "read" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "organizationId" TEXT,
ADD COLUMN     "password" TEXT;

-- CreateTable
CREATE TABLE "WidgetSettings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366F1',
    "operatorName" TEXT NOT NULL DEFAULT 'Support Team',
    "operatorAvatar" TEXT,
    "welcomeMessage" TEXT NOT NULL DEFAULT 'Вітаю! 👋 Чим можу допомогти?',
    "showWelcome" BOOLEAN NOT NULL DEFAULT true,
    "position" TEXT NOT NULL DEFAULT 'right',
    "size" TEXT NOT NULL DEFAULT 'standard',
    "language" TEXT NOT NULL DEFAULT 'uk',
    "showContactForm" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "secondaryColor" TEXT NOT NULL DEFAULT '#B6FF00',

    CONSTRAINT "WidgetSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WidgetSettings_organizationId_key" ON "WidgetSettings"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "User_organizationId_key" ON "User"("organizationId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "WidgetSettings"("organizationId") ON DELETE SET NULL ON UPDATE CASCADE;
