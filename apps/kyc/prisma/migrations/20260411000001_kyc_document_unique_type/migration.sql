-- Remove duplicate (profile_id, type) rows, keeping the most recent upload per type
DELETE FROM kyc_documents a
  USING kyc_documents b
  WHERE a.profile_id = b.profile_id
    AND a.type = b.type
    AND a.uploaded_at < b.uploaded_at;

-- Add unique constraint so upsert works correctly
ALTER TABLE "kyc_documents"
  ADD CONSTRAINT "kyc_documents_profile_id_type_key" UNIQUE ("profile_id", "type");
