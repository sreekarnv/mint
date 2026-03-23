-- CreateEnum
CREATE TYPE "TxnType" AS ENUM ('TOPUP', 'TRANSFER', 'RECURRING_TOPUP', 'RECURRING_TRANSFER', 'SPLIT_PAYMENT', 'REQUEST_PAYMENT');

-- CreateEnum
CREATE TYPE "TxnStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REVERSED');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('FOOD', 'TRANSPORT', 'ENTERTAINMENT', 'TRANSFER', 'UTILITIES', 'OTHER');

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "idempotency_key" VARCHAR(255) NOT NULL,
    "type" "TxnType" NOT NULL,
    "status" "TxnStatus" NOT NULL DEFAULT 'PENDING',
    "sender_id" TEXT NOT NULL,
    "recipient_id" TEXT,
    "sender_wallet" TEXT NOT NULL,
    "recipient_wallet" TEXT,
    "sender_amount" BIGINT NOT NULL,
    "sender_currency" TEXT NOT NULL DEFAULT 'USD',
    "recipient_amount" BIGINT,
    "recipient_currency" TEXT,
    "fx_rate" DECIMAL(20,10),
    "fx_rate_locked_at" TIMESTAMPTZ,
    "description" TEXT,
    "category" "Category",
    "merchant" VARCHAR(255),
    "fraud_decision" VARCHAR(10),
    "fraud_score" INTEGER,
    "recurring_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processing_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_schedules" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "cron" VARCHAR(100) NOT NULL,
    "amount" BIGINT NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "recipient_id" TEXT,
    "description" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "last_run" TIMESTAMPTZ,
    "next_run" TIMESTAMPTZ,
    "failure_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recurring_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transactions_idempotency_key_key" ON "transactions"("idempotency_key");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_recurring_id_fkey" FOREIGN KEY ("recurring_id") REFERENCES "recurring_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
