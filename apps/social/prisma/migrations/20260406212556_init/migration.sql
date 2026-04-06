-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SplitStatus" AS ENUM ('OPEN', 'SETTLED');

-- CreateEnum
CREATE TYPE "ParticipantStatus" AS ENUM ('PENDING', 'PAID');

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "money_requests" (
    "id" TEXT NOT NULL,
    "requester_id" TEXT NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "note" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "bullmq_job_id" VARCHAR(255),
    "transaction_id" TEXT,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMPTZ,
    "declined_at" TIMESTAMPTZ,
    "expired_at" TIMESTAMPTZ,

    CONSTRAINT "money_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_splits" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "total_cents" BIGINT NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "status" "SplitStatus" NOT NULL DEFAULT 'OPEN',
    "settled_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bill_splits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "split_participants" (
    "id" TEXT NOT NULL,
    "split_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount_cents" BIGINT NOT NULL,
    "status" "ParticipantStatus" NOT NULL DEFAULT 'PENDING',
    "transaction_id" TEXT,
    "paid_at" TIMESTAMPTZ,

    CONSTRAINT "split_participants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contacts_owner_id_idx" ON "contacts"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "contacts_owner_id_contact_id_key" ON "contacts"("owner_id", "contact_id");

-- CreateIndex
CREATE INDEX "money_requests_requester_id_status_idx" ON "money_requests"("requester_id", "status");

-- CreateIndex
CREATE INDEX "money_requests_recipient_id_status_idx" ON "money_requests"("recipient_id", "status");

-- CreateIndex
CREATE INDEX "bill_splits_creator_id_status_idx" ON "bill_splits"("creator_id", "status");

-- CreateIndex
CREATE INDEX "split_participants_user_id_status_idx" ON "split_participants"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "split_participants_split_id_user_id_key" ON "split_participants"("split_id", "user_id");

-- AddForeignKey
ALTER TABLE "split_participants" ADD CONSTRAINT "split_participants_split_id_fkey" FOREIGN KEY ("split_id") REFERENCES "bill_splits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
