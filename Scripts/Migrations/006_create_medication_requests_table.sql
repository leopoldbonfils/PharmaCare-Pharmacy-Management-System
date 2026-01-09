-- =============================================
-- Migration: 006_create_medication_requests_table.sql
-- Description: Creates the MedicationRequests table
-- Dependencies: Patients (FK: PatientID), Users (FK: PharmacistID, ReviewedBy), Prescriptions (FK: PrescriptionID)
-- =============================================

USE [PharmaCareDB]
GO

PRINT '=============================================';
PRINT 'Creating MedicationRequests Table...';
PRINT '=============================================';
GO

-- Drop table if exists (for clean migration)
IF OBJECT_ID('dbo.MedicationRequests', 'U') IS NOT NULL
BEGIN
    PRINT 'Dropping existing MedicationRequests table...';
    -- Drop dependent table first
    IF OBJECT_ID('dbo.MedicationRequestItems', 'U') IS NOT NULL DROP TABLE [dbo].[MedicationRequestItems];
    DROP TABLE [dbo].[MedicationRequests];
END
GO

-- Create MedicationRequests table
CREATE TABLE [dbo].[MedicationRequests] (
    [MedicationRequestID] INT IDENTITY(1,1) NOT NULL,
    [PatientID] INT NOT NULL,
    [PharmacistID] INT NOT NULL,
    [Symptoms] NVARCHAR(1000) NOT NULL,
    [ImageUrl] NVARCHAR(500) NULL,
    [Notes] NVARCHAR(1000) NULL,
    [PharmacistNotes] NVARCHAR(1000) NULL,
    [Status] NVARCHAR(20) NOT NULL DEFAULT 'Pending',
    [PrescriptionID] INT NULL,
    [RequestDate] DATETIME2 NOT NULL DEFAULT GETDATE(),
    [ReviewedDate] DATETIME2 NULL,
    [ReviewedBy] INT NULL,
    CONSTRAINT [PK_MedicationRequests] PRIMARY KEY CLUSTERED ([MedicationRequestID] ASC),
    CONSTRAINT [FK_MedicationRequests_Patients] FOREIGN KEY ([PatientID]) 
        REFERENCES [dbo].[Patients] ([PatientID]) 
        ON DELETE RESTRICT,
    CONSTRAINT [FK_MedicationRequests_Users_Pharmacist] FOREIGN KEY ([PharmacistID]) 
        REFERENCES [dbo].[Users] ([UserID]) 
        ON DELETE RESTRICT,
    CONSTRAINT [FK_MedicationRequests_Users_ReviewedBy] FOREIGN KEY ([ReviewedBy]) 
        REFERENCES [dbo].[Users] ([UserID]) 
        ON DELETE SET NULL,
    CONSTRAINT [FK_MedicationRequests_Prescriptions] FOREIGN KEY ([PrescriptionID]) 
        REFERENCES [dbo].[Prescriptions] ([PrescriptionID]) 
        ON DELETE SET NULL
)
GO

-- Create indexes
CREATE NONCLUSTERED INDEX [IX_MedicationRequests_PatientID] ON [dbo].[MedicationRequests] ([PatientID] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_MedicationRequests_PharmacistID] ON [dbo].[MedicationRequests] ([PharmacistID] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_MedicationRequests_Status] ON [dbo].[MedicationRequests] ([Status] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_MedicationRequests_RequestDate] ON [dbo].[MedicationRequests] ([RequestDate] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_MedicationRequests_ReviewedBy] ON [dbo].[MedicationRequests] ([ReviewedBy] ASC)
GO

PRINT 'MedicationRequests table created successfully!';
GO

-- =============================================
-- DOWN Migration (Rollback)
-- =============================================
-- To rollback this migration, run:
-- DROP TABLE IF EXISTS [dbo].[MedicationRequests];
-- =============================================

