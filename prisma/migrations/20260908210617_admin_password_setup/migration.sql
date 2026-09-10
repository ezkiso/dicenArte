-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordSetupExpires" TIMESTAMP(3),
ADD COLUMN     "passwordSetupTokenHash" TEXT;
