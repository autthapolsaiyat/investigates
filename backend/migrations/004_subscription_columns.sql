-- Migration: Add subscription columns to users table
-- Run this if subscription columns don't exist yet

-- Check and add subscription_start if not exists
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'users') AND name = 'subscription_start'
)
BEGIN
    ALTER TABLE [dbo].[users] ADD [subscription_start] DATETIME NULL;
    PRINT 'Added subscription_start column';
END
GO

-- Check and add subscription_end if not exists  
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'users') AND name = 'subscription_end'
)
BEGIN
    ALTER TABLE [dbo].[users] ADD [subscription_end] DATETIME NULL;
    PRINT 'Added subscription_end column';
END
GO

-- Check and add approved_by if not exists
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'users') AND name = 'approved_by'
)
BEGIN
    ALTER TABLE [dbo].[users] ADD [approved_by] INT NULL;
    PRINT 'Added approved_by column';
END
GO

-- Check and add approved_at if not exists
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'users') AND name = 'approved_at'
)
BEGIN
    ALTER TABLE [dbo].[users] ADD [approved_at] DATETIME NULL;
    PRINT 'Added approved_at column';
END
GO

PRINT 'Migration completed successfully';
