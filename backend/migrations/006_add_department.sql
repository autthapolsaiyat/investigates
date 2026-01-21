-- Migration 006: Add department column to users table
-- Run this in Azure Portal Query Editor

-- Add department column if not exists
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'department'
)
BEGIN
    ALTER TABLE users ADD department NVARCHAR(100) NULL;
    PRINT 'Added department column to users table';
END
ELSE
BEGIN
    PRINT 'department column already exists';
END
