-- ============================================
-- Migration 003: Support Tickets System
-- Date: 2026-01-21
-- Description: Create support_tickets table for user issue reporting
-- ============================================

-- Create support_tickets table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[support_tickets]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[support_tickets] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [ticket_number] NVARCHAR(20) NOT NULL UNIQUE,
        
        -- Reporter
        [user_id] INT NOT NULL,
        
        -- Ticket Details
        [subject] NVARCHAR(255) NOT NULL,
        [description] NVARCHAR(MAX) NOT NULL,
        [category] NVARCHAR(50) NOT NULL DEFAULT 'bug',
        
        -- Screenshot (Base64)
        [screenshot_data] NVARCHAR(MAX) NULL,
        [screenshot_filename] NVARCHAR(255) NULL,
        
        -- Status & Priority
        [status] NVARCHAR(20) NOT NULL DEFAULT 'open',
        [priority] NVARCHAR(20) NOT NULL DEFAULT 'medium',
        
        -- Admin Response
        [admin_response] NVARCHAR(MAX) NULL,
        [resolved_by] INT NULL,
        [resolved_at] DATETIME NULL,
        
        -- Notification tracking
        [user_read_at] DATETIME NULL,
        
        -- Timestamps
        [created_at] DATETIME NOT NULL DEFAULT GETUTCDATE(),
        [updated_at] DATETIME NOT NULL DEFAULT GETUTCDATE(),
        
        -- Foreign Keys
        CONSTRAINT [FK_support_tickets_user] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]),
        CONSTRAINT [FK_support_tickets_resolver] FOREIGN KEY ([resolved_by]) REFERENCES [dbo].[users]([id])
    );
    
    PRINT 'Created table: support_tickets';
END
GO

-- Create indexes for performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_support_tickets_ticket_number' AND object_id = OBJECT_ID('support_tickets'))
BEGIN
    CREATE INDEX [IX_support_tickets_ticket_number] ON [dbo].[support_tickets]([ticket_number]);
    PRINT 'Created index: IX_support_tickets_ticket_number';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_support_tickets_user_id' AND object_id = OBJECT_ID('support_tickets'))
BEGIN
    CREATE INDEX [IX_support_tickets_user_id] ON [dbo].[support_tickets]([user_id]);
    PRINT 'Created index: IX_support_tickets_user_id';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_support_tickets_status' AND object_id = OBJECT_ID('support_tickets'))
BEGIN
    CREATE INDEX [IX_support_tickets_status] ON [dbo].[support_tickets]([status]);
    PRINT 'Created index: IX_support_tickets_status';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_support_tickets_created_at' AND object_id = OBJECT_ID('support_tickets'))
BEGIN
    CREATE INDEX [IX_support_tickets_created_at] ON [dbo].[support_tickets]([created_at] DESC);
    PRINT 'Created index: IX_support_tickets_created_at';
END
GO

-- Verify table creation
SELECT 
    'support_tickets' as TableName,
    COUNT(*) as ColumnCount
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'support_tickets';
GO

PRINT '✅ Migration 003 completed: Support Tickets System';
GO
