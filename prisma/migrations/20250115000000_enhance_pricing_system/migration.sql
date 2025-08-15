-- Enhance Pricing System
-- This migration adds comprehensive pricing features including regional pricing, pricing tiers, discounts, and price history

-- Add new columns to existing Pricing table if they don't exist
DO $$
BEGIN
    -- Add currency column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Pricing' AND column_name = 'currency') THEN
        ALTER TABLE "Pricing" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD';
    END IF;
    
    -- Add region column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Pricing' AND column_name = 'region') THEN
        ALTER TABLE "Pricing" ADD COLUMN "region" TEXT;
    END IF;
    
    -- Add isActive column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Pricing' AND column_name = 'isActive') THEN
        ALTER TABLE "Pricing" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
    END IF;
    
    -- Add validFrom column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Pricing' AND column_name = 'validFrom') THEN
        ALTER TABLE "Pricing" ADD COLUMN "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    -- Add validTo column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Pricing' AND column_name = 'validTo') THEN
        ALTER TABLE "Pricing" ADD COLUMN "validTo" TIMESTAMP(3);
    END IF;
    
    -- Add discount column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Pricing' AND column_name = 'discount') THEN
        ALTER TABLE "Pricing" ADD COLUMN "discount" DOUBLE PRECISION;
    END IF;
    
    -- Add originalPrice column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Pricing' AND column_name = 'originalPrice') THEN
        ALTER TABLE "Pricing" ADD COLUMN "originalPrice" DOUBLE PRECISION;
    END IF;
    
    -- Add pricingTier column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Pricing' AND column_name = 'pricingTier') THEN
        ALTER TABLE "Pricing" ADD COLUMN "pricingTier" TEXT;
    END IF;
    
    -- Add createdAt column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Pricing' AND column_name = 'createdAt') THEN
        ALTER TABLE "Pricing" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    -- Add updatedAt column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Pricing' AND column_name = 'updatedAt') THEN
        ALTER TABLE "Pricing" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Add new columns to existing CoursePricing table if they don't exist
DO $$
BEGIN
    -- Add isActive column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'CoursePricing' AND column_name = 'isActive') THEN
        ALTER TABLE "CoursePricing" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
    END IF;
    
    -- Add createdAt column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'CoursePricing' AND column_name = 'createdAt') THEN
        ALTER TABLE "CoursePricing" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    -- Add updatedAt column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'CoursePricing' AND column_name = 'updatedAt') THEN
        ALTER TABLE "CoursePricing" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Create PricingHistory table if it doesn't exist
CREATE TABLE IF NOT EXISTS "PricingHistory" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "oldPrice" DOUBLE PRECISION NOT NULL,
    "newPrice" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "region" TEXT,
    "changeReason" TEXT,
    "changedBy" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PricingHistory_pkey" PRIMARY KEY ("id")
);

-- Add unique constraints if they don't exist
DO $$
BEGIN
    -- Add unique constraint for Pricing country+region if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Pricing_country_region_key') THEN
        CREATE UNIQUE INDEX "Pricing_country_region_key" ON "Pricing"("country", "region");
    END IF;
    
    -- Add unique constraint for CoursePricing courseId+pricingId if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'CoursePricing_courseId_pricingId_key') THEN
        CREATE UNIQUE INDEX "CoursePricing_courseId_pricingId_key" ON "CoursePricing"("courseId", "pricingId");
    END IF;
END $$;

-- Add indexes for performance if they don't exist
DO $$
BEGIN
    -- Add index for CoursePricing courseId+isActive if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'CoursePricing_courseId_isActive_idx') THEN
        CREATE INDEX "CoursePricing_courseId_isActive_idx" ON "CoursePricing"("courseId", "isActive");
    END IF;
    
    -- Add index for PricingHistory courseId+changedAt if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PricingHistory_courseId_changedAt_idx') THEN
        CREATE INDEX "PricingHistory_courseId_changedAt_idx" ON "PricingHistory"("courseId", "changedAt");
    END IF;
    
    -- Add index for PricingHistory country+changedAt if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PricingHistory_country_changedAt_idx') THEN
        CREATE INDEX "PricingHistory_country_changedAt_idx" ON "PricingHistory"("country", "changedAt");
    END IF;
END $$;

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
    -- Add foreign key for PricingHistory courseId if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PricingHistory_courseId_fkey') THEN
        ALTER TABLE "PricingHistory" ADD CONSTRAINT "PricingHistory_courseId_fkey" 
        FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Update existing pricing records with default values
UPDATE "Pricing" SET 
    "currency" = COALESCE("currency", 'USD'),
    "isActive" = COALESCE("isActive", true),
    "validFrom" = COALESCE("validFrom", CURRENT_TIMESTAMP),
    "originalPrice" = COALESCE("originalPrice", "price"),
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "currency" IS NULL OR "isActive" IS NULL OR "validFrom" IS NULL OR "originalPrice" IS NULL OR "updatedAt" IS NULL;

-- Update existing course pricing records with default values
UPDATE "CoursePricing" SET 
    "isActive" = COALESCE("isActive", true),
    "createdAt" = COALESCE("createdAt", CURRENT_TIMESTAMP),
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "isActive" IS NULL OR "createdAt" IS NULL OR "updatedAt" IS NULL;

-- Insert sample pricing data only if no pricing records exist
INSERT INTO "Pricing" ("id", "price", "currency", "country", "region", "pricingTier", "originalPrice", "updatedAt")
SELECT 
    'pricing-us-basic', 99.99, 'USD', 'US', 'North America', 'BASIC', 99.99, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Pricing" WHERE "country" = 'US' AND "region" = 'North America');

INSERT INTO "Pricing" ("id", "price", "currency", "country", "region", "pricingTier", "originalPrice", "updatedAt")
SELECT 
    'pricing-uk-basic', 79.99, 'GBP', 'UK', 'Europe', 'BASIC', 79.99, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Pricing" WHERE "country" = 'UK' AND "region" = 'Europe');

INSERT INTO "Pricing" ("id", "price", "currency", "country", "region", "pricingTier", "originalPrice", "updatedAt")
SELECT 
    'pricing-eu-basic', 89.99, 'EUR', 'DE', 'Europe', 'BASIC', 89.99, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Pricing" WHERE "country" = 'DE' AND "region" = 'Europe');
