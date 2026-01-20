-- ============================================
-- Migration: Add Soft Delete to Cases Table
-- Date: 2026-01-20
-- Description: Add is_active, deleted_at, deleted_by columns
-- ============================================

-- Step 1: Add new columns
ALTER TABLE cases ADD is_active BIT DEFAULT 1 NOT NULL;
ALTER TABLE cases ADD deleted_at DATETIME NULL;
ALTER TABLE cases ADD deleted_by INT NULL;

-- Step 2: Add foreign key for deleted_by
ALTER TABLE cases ADD CONSTRAINT FK_cases_deleted_by 
    FOREIGN KEY (deleted_by) REFERENCES users(id);

-- Step 3: Create index for faster queries
CREATE INDEX idx_cases_is_active ON cases(is_active);

-- Step 4: Set all existing cases as active
UPDATE cases SET is_active = 1 WHERE is_active IS NULL;

-- ============================================
-- Verification Query
-- ============================================
-- Run this to verify the migration:
-- SELECT 
--     COLUMN_NAME, 
--     DATA_TYPE, 
--     IS_NULLABLE,
--     COLUMN_DEFAULT
-- FROM INFORMATION_SCHEMA.COLUMNS 
-- WHERE TABLE_NAME = 'cases' 
-- AND COLUMN_NAME IN ('is_active', 'deleted_at', 'deleted_by');

-- ============================================
-- Rollback Script (if needed)
-- ============================================
-- ALTER TABLE cases DROP CONSTRAINT FK_cases_deleted_by;
-- DROP INDEX idx_cases_is_active ON cases;
-- ALTER TABLE cases DROP COLUMN deleted_by;
-- ALTER TABLE cases DROP COLUMN deleted_at;
-- ALTER TABLE cases DROP COLUMN is_active;
