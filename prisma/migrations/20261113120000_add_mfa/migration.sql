-- Idempotent: safe to re-run after a partial failure (`prisma migrate resolve` + deploy).
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "mfaSecretEncrypted" TEXT,
ADD COLUMN IF NOT EXISTS "mfaConfirmedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "mfaLastUsedCounter" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "MfaRecoveryCode" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "codeHash" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "MfaRecoveryCode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MfaChallenge" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MfaChallenge_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "MfaRecoveryCode_userId_codeHash_idx" ON "MfaRecoveryCode"("userId", "codeHash");
CREATE UNIQUE INDEX IF NOT EXISTS "MfaChallenge_tokenHash_key" ON "MfaChallenge"("tokenHash");
CREATE INDEX IF NOT EXISTS "MfaChallenge_userId_idx" ON "MfaChallenge"("userId");

DO $$ BEGIN
  ALTER TABLE "MfaRecoveryCode" ADD CONSTRAINT "MfaRecoveryCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "MfaChallenge" ADD CONSTRAINT "MfaChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
