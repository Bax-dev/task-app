-- Idempotent. Existing accounts are grandfathered as verified so nobody is locked out on deploy;
-- only accounts created after this release must prove their address.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP(3);

UPDATE "User" SET "emailVerifiedAt" = "createdAt" WHERE "emailVerifiedAt" IS NULL;
