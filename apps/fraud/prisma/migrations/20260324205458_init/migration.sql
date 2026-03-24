-- CreateTable
CREATE TABLE "fraud_cases" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "decision" VARCHAR(10) NOT NULL,
    "score" INTEGER NOT NULL,
    "rules_fired" TEXT[],
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMPTZ,
    "review_outcome" VARCHAR(20),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fraud_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_transfer_stats" (
    "user_id" TEXT NOT NULL,
    "count" BIGINT NOT NULL DEFAULT 0,
    "sum_cents" BIGINT NOT NULL DEFAULT 0,
    "sum_sq_cents" DECIMAL(30,0) NOT NULL DEFAULT 0,
    "last_updated" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_transfer_stats_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fraud_cases_transaction_id_key" ON "fraud_cases"("transaction_id");
