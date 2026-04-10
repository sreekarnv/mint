-- Change idempotency_key from VARCHAR(255) to UUID.
-- Existing non-UUID values (cuids) are removed first since they cannot be cast.
TRUNCATE TABLE "transactions";

ALTER TABLE "transactions"
  ALTER COLUMN "idempotency_key" TYPE UUID USING "idempotency_key"::UUID;
