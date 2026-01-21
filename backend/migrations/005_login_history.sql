-- Migration: Create login_history table
-- Track user login activity with device and location info

-- Drop table if exists (for clean migration)
IF OBJECT_ID(N'login_history', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[login_history] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [user_id] INT NOT NULL,
        
        -- Timestamp
        [login_at] DATETIME NOT NULL DEFAULT GETUTCDATE(),
        
        -- Device Info
        [ip_address] NVARCHAR(45) NULL,
        [user_agent] NVARCHAR(500) NULL,
        [device_type] NVARCHAR(20) NULL,
        [browser] NVARCHAR(50) NULL,
        [os] NVARCHAR(50) NULL,
        
        -- Location from IP
        [country] NVARCHAR(100) NULL,
        [country_code] NVARCHAR(10) NULL,
        [region] NVARCHAR(100) NULL,
        [city] NVARCHAR(100) NULL,
        [latitude] DECIMAL(10, 6) NULL,
        [longitude] DECIMAL(10, 6) NULL,
        [isp] NVARCHAR(200) NULL,
        
        -- Login Status
        [login_success] BIT NOT NULL DEFAULT 1,
        [failure_reason] NVARCHAR(100) NULL,
        
        -- Foreign Key
        CONSTRAINT [FK_login_history_user] FOREIGN KEY ([user_id]) 
            REFERENCES [dbo].[users]([id]) ON DELETE CASCADE
    );

    -- Create indexes for better query performance
    CREATE INDEX [IX_login_history_user_id] ON [dbo].[login_history]([user_id]);
    CREATE INDEX [IX_login_history_login_at] ON [dbo].[login_history]([login_at] DESC);
    CREATE INDEX [IX_login_history_location] ON [dbo].[login_history]([latitude], [longitude]) 
        WHERE [latitude] IS NOT NULL AND [longitude] IS NOT NULL;

    PRINT 'Created login_history table with indexes';
END
ELSE
BEGIN
    PRINT 'login_history table already exists';
END
GO
