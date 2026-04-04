-- CreateEnum
CREATE TYPE "Category" AS ENUM ('FOOD', 'TRANSPORT', 'ENTERTAINMENT', 'UTILITIES', 'OTHER');

-- CreateTable
CREATE TABLE "spend_events" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount_cents" BIGINT NOT NULL,
    "original_currency" VARCHAR(3) NOT NULL,
    "base_currency" VARCHAR(3) NOT NULL,
    "base_amount_cents" BIGINT NOT NULL,
    "category" "Category" NOT NULL,
    "merchant" VARCHAR(255),
    "occurred_at" TIMESTAMPTZ NOT NULL,
    "year_month" VARCHAR(7) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spend_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_aggregates" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "year_month" VARCHAR(7) NOT NULL,
    "category" "Category" NOT NULL,
    "total_cents" BIGINT NOT NULL DEFAULT 0,
    "count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "monthly_aggregates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budgets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "limit_cents" BIGINT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_analytics_prefs" (
    "user_id" TEXT NOT NULL,
    "base_currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_analytics_prefs_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "spend_events_transaction_id_key" ON "spend_events"("transaction_id");

-- CreateIndex
CREATE INDEX "spend_events_user_id_year_month_idx" ON "spend_events"("user_id", "year_month");

-- CreateIndex
CREATE INDEX "spend_events_user_id_category_idx" ON "spend_events"("user_id", "category");

-- CreateIndex
CREATE INDEX "monthly_aggregates_user_id_year_month_idx" ON "monthly_aggregates"("user_id", "year_month");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_aggregates_user_id_year_month_category_key" ON "monthly_aggregates"("user_id", "year_month", "category");

-- CreateIndex
CREATE INDEX "budgets_user_id_active_idx" ON "budgets"("user_id", "active");

-- CreateIndex
CREATE UNIQUE INDEX "budgets_user_id_category_key" ON "budgets"("user_id", "category");
