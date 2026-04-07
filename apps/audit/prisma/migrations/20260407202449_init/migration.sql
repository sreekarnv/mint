-- CreateTable
CREATE TABLE "audit_log" (
    "id" BIGSERIAL NOT NULL,
    "event_id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource_type" TEXT,
    "resource_id" TEXT,
    "before_state" JSONB,
    "after_state" JSONB,
    "ip_address" TEXT,
    "trace_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "audit_log_event_id_key" ON "audit_log"("event_id");

-- CreateIndex
CREATE INDEX "audit_log_event_id_idx" ON "audit_log"("event_id");

-- CreateIndex
CREATE INDEX "audit_log_actor_id_idx" ON "audit_log"("actor_id");

-- CreateIndex
CREATE INDEX "audit_log_action_idx" ON "audit_log"("action");

-- CreateIndex
CREATE INDEX "audit_log_created_at_idx" ON "audit_log"("created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_log_actor_id_action_created_at_idx" ON "audit_log"("actor_id", "action", "created_at" DESC);
