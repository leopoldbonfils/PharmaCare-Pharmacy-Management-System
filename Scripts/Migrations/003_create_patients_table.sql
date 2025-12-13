-- =============================================
-- Migration: 003_create_patients_table.sql
-- Description: Creates the Patients table
-- Dependencies: Users (FK: UserID)
-- =============================================

USE [PharmaCareDB]
GO

PRINT '=============================================';
PRINT 'Creating Patients Table...';
PRINT '=============================================';
GO

-- Drop table if exists (for clean migration)
IF OBJECT_ID('dbo.Patients', 'U') IS NOT NULL
BEGIN
    PRINT 'Dropping existing Patients table...';
    -- Drop dependent tables first
    IF OBJECT_ID('dbo.Prescriptions', 'U') IS NOT NULL DROP TABLE [dbo].[Prescriptions];
    IF OBJECT_ID('dbo.Sales', 'U') IS NOT NULL DROP TABLE [dbo].[Sales];
    IF OBJECT_ID('dbo.MedicationRequests', 'U') IS NOT NULL DROP TABLE [dbo].[MedicationRequests];
    IF OBJECT_ID('dbo.Payments', 'U') IS NOT NULL DROP TABLE [dbo].[Payments];
    DROP TABLE [dbo].[Patients];
END
GO

-- Create Patients table
CREATE TABLE [dbo].[Patients] (
    [PatientID] INT IDENTITY(1,1) NOT NULL,
    [UserID] INT NULL, -- Foreign key to Users (nullable - patient may not have account)
    [FirstName] NVARCHAR(50) NOT NULL,
    [LastName] NVARCHAR(50) NOT NULL,
    [DateOfBirth] DATETIME2 NOT NULL,
    [Gender] NVARCHAR(10) NOT NULL,
    [PhoneNumber] NVARCHAR(20) NOT NULL,
    [Email] NVARCHAR(100) NULL,
    [Address] NVARCHAR(200) NOT NULL,
    [District] NVARCHAR(50) NOT NULL,
    [Sector] NVARCHAR(50) NOT NULL,
    [EmergencyContact] NVARCHAR(20) NOT NULL,
    [EmergencyContactName] NVARCHAR(100) NOT NULL,
    [MedicalHistory] NVARCHAR(MAX) NULL,
    [Allergies] NVARCHAR(MAX) NULL,
    [BloodType] NVARCHAR(5) NULL,
    [IsActive] BIT NOT NULL DEFAULT 1,
    [CreatedDate] DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT [PK_Patients] PRIMARY KEY CLUSTERED ([PatientID] ASC),
    CONSTRAINT [FK_Patients_Users] FOREIGN KEY ([UserID]) 
        REFERENCES [dbo].[Users] ([UserID]) 
        ON DELETE SET NULL
)
GO

-- Create indexes
CREATE NONCLUSTERED INDEX [IX_Patients_UserID] ON [dbo].[Patients] ([UserID] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_Patients_FirstName_LastName] ON [dbo].[Patients] ([FirstName] ASC, [LastName] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_Patients_PhoneNumber] ON [dbo].[Patients] ([PhoneNumber] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_Patients_IsActive] ON [dbo].[Patients] ([IsActive] ASC)
GO

PRINT 'Patients table created successfully!';
GO

-- =============================================
-- DOWN Migration (Rollback)
-- =============================================
-- To rollback this migration, run:
-- DROP TABLE IF EXISTS [dbo].[Patients];
-- =============================================

