-- CreateTable
CREATE TABLE "BusinessHours" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Kyiv',
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "offlineMessage" TEXT NOT NULL DEFAULT 'Дякуємо за звернення! 🕐 Наразі ми не в мережі. Залиште свій email або телефон, і ми зв''яжемося з вами в робочий час.',
    "monday" JSONB NOT NULL DEFAULT '{"start": "09:00", "end": "18:00", "isOpen": true}',
    "tuesday" JSONB NOT NULL DEFAULT '{"start": "09:00", "end": "18:00", "isOpen": true}',
    "wednesday" JSONB NOT NULL DEFAULT '{"start": "09:00", "end": "18:00", "isOpen": true}',
    "thursday" JSONB NOT NULL DEFAULT '{"start": "09:00", "end": "18:00", "isOpen": true}',
    "friday" JSONB NOT NULL DEFAULT '{"start": "09:00", "end": "18:00", "isOpen": true}',
    "saturday" JSONB NOT NULL DEFAULT '{"start": "10:00", "end": "15:00", "isOpen": false}',
    "sunday" JSONB NOT NULL DEFAULT '{"start": "10:00", "end": "15:00", "isOpen": false}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessHours_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BusinessHours_siteId_key" ON "BusinessHours"("siteId");

-- AddForeignKey
ALTER TABLE "BusinessHours" ADD CONSTRAINT "BusinessHours_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
