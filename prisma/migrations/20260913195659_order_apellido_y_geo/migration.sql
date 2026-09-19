/*
  Warnings:

  - You are about to drop the column `customerName` on the `Order` table. All the data in the column will be lost.
  - Added the required column `customerFirstName` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerLastName` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" RENAME COLUMN "customerName" TO "customerFirstName";
ALTER TABLE "Order" ADD COLUMN "customerLastName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Order" ADD COLUMN "shippingLat" DOUBLE PRECISION;
ALTER TABLE "Order" ADD COLUMN "shippingLng" DOUBLE PRECISION;
ALTER TABLE "Order" ALTER COLUMN "customerLastName" DROP DEFAULT;