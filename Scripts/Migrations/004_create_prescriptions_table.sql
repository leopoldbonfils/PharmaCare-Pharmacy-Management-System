-- =============================================
-- Migration: 004_create_prescriptions_table.sql
-- Description: Creates the Prescriptions table
-- Dependencies: Patients (FK: PatientID), Users (FK: CreatedBy, DispensedBy)
-- =============================================

USE [PharmaCareDB]
GO

PRINT '=============================================';
PRINT 'Creating Prescriptions Table...';
PRINT '=============================================';
GO

-- Drop table if exists (for clean migration)
IF OBJECT_ID('dbo.Prescriptions', 'U') IS NOT NULL
BEGIN
    PRINT 'Dropping existing Prescriptions table...';
    -- Drop dependent tables first
    IF OBJECT_ID('dbo.PrescriptionItems', 'U') IS NOT NULL DROP TABLE [dbo].[PrescriptionItems];
    IF OBJECT_ID('dbo.Messages', 'U') IS NOT NULL DROP TABLE [dbo].[Messages];
    DROP TABLE [dbo].[Prescriptions];
END
GO

-- Create Prescriptions table
CREATE TABLE [dbo].[Prescriptions] (
    [PrescriptionID] INT IDENTITY(1,1) NOT NULL,
    [PatientID] INT NOT NULL,
    [DoctorName] NVARCHAR(100) NOT NULL,
    [DoctorContact] NVARCHAR(20) NOT NULL,
    [HospitalName] NVARCHAR(100) NULL,
    [PrescriptionDate] DATETIME2 NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    [Diagnosis] NVARCHAR(500) NOT NULL,
    [Status] NVARCHAR(20) NOT NULL DEFAULT 'Pending',
    [Instructions] NVARCHAR(MAX) NULL,
    [CreatedBy] INT NOT NULL,
    [CreatedDate] DATETIME2 NOT NULL DEFAULT GETDATE(),
    [DispensedDate] DATETIME2 NULL,
    [DispensedBy] INT NULL,
    [PrescriptionImageUrl] NVARCHAR(500) NULL,
    CONSTRAINT [PK_Prescriptions] PRIMARY KEY CLUSTERED ([PrescriptionID] ASC),
    CONSTRAINT [FK_Prescriptions_Patients] FOREIGN KEY ([PatientID]) 
        REFERENCES [dbo].[Patients] ([PatientID]) 
        ON DELETE RESTRICT,
    CONSTRAINT [FK_Prescriptions_Users_CreatedBy] FOREIGN KEY ([CreatedBy]) 
        REFERENCES [dbo].[Users] ([UserID]) 
        ON DELETE RESTRICT,
    CONSTRAINT [FK_Prescriptions_Users_DispensedBy] FOREIGN KEY ([DispensedBy]) 
        REFERENCES [dbo].[Users] ([UserID]) 
        ON DELETE RESTRICT
)
GO

-- Create indexes
CREATE NONCLUSTERED INDEX [IX_Prescriptions_PatientID] ON [dbo].[Prescriptions] ([PatientID] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_Prescriptions_CreatedBy] ON [dbo].[Prescriptions] ([CreatedBy] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_Prescriptions_DispensedBy] ON [dbo].[Prescriptions] ([DispensedBy] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_Prescriptions_Status] ON [dbo].[Prescriptions] ([Status] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_Prescriptions_PrescriptionDate] ON [dbo].[Prescriptions] ([PrescriptionDate] ASC)
GO

PRINT 'Prescriptions table created successfully!';
GO

-- =============================================
-- DOWN Migration (Rollback)
-- =============================================
-- To rollback this migration, run:
-- DROP TABLE IF EXISTS [dbo].[Prescriptions];
-- =============================================

