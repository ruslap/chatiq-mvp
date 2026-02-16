-- DropIndex: Allow multiple users per organization (was @unique, now just a regular FK)
DROP INDEX IF EXISTS "User_organizationId_key";
