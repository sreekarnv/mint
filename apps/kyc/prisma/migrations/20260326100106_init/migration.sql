-- CreateEnum
CREATE TYPE "KycTier" AS ENUM ('UNVERIFIED', 'BASIC', 'VERIFIED');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('NONE', 'PENDING_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DocType" AS ENUM ('PASSPORT', 'DRIVERS_LICENSE', 'SELFIE', 'UTILITY_BILL', 'OTHER');

-- CreateTable
CREATE TABLE "kyc_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tier" "KycTier" NOT NULL DEFAULT 'UNVERIFIED',
    "status" "KycStatus" NOT NULL DEFAULT 'NONE',
    "provider_ref" VARCHAR(255),
    "rejection_reason" TEXT,
    "submitted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kyc_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kyc_documents" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "type" "DocType" NOT NULL,
    "doc_name" TEXT,
    "s3_key" TEXT NOT NULL,
    "status" VARCHAR(255) NOT NULL DEFAULT 'PENDING',
    "uploaded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kyc_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kyc_profiles_user_id_key" ON "kyc_profiles"("user_id");

-- AddForeignKey
ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "kyc_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
