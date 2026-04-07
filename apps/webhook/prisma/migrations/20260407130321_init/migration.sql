-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "webhook_endpoints" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" VARCHAR(64) NOT NULL,
    "events" TEXT[],
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_endpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_deliveries" (
    "id" TEXT NOT NULL,
    "endpoint_id" TEXT NOT NULL,
    "event_type" VARCHAR(60) NOT NULL,
    "event_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "response_status" INTEGER,
    "response_body" TEXT,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "next_retry" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delivered_at" TIMESTAMPTZ,

    CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "webhook_endpoints_user_id_active_idx" ON "webhook_endpoints"("user_id", "active");

-- CreateIndex
CREATE INDEX "webhook_deliveries_endpoint_id_status_idx" ON "webhook_deliveries"("endpoint_id", "status");

-- CreateIndex
CREATE INDEX "webhook_deliveries_event_id_idx" ON "webhook_deliveries"("event_id");

-- AddForeignKey
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_endpoint_id_fkey" FOREIGN KEY ("endpoint_id") REFERENCES "webhook_endpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
