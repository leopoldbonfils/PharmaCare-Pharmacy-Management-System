-- =============================================
-- Migration: 010_create_payments_table.sql
-- Description: Creates the Payments table
-- Dependencies: Patients (FK: PatientID), Prescriptions (FK: PrescriptionID), MedicationRequests (FK: MedicationRequestID)
-- =============================================

USE [PharmaCareDB]
GO

PRINT '=============================================';
PRINT 'Creating Payments Table...';
PRINT '=============================================';
GO

-- Drop table if exists (for clean migration)
IF OBJECT_ID('dbo.Payments', 'U') IS NOT NULL
BEGIN
    PRINT 'Dropping existing Payments table...';
    DROP TABLE [dbo].[Payments];
END
GO

-- Create Payments table
CREATE TABLE [dbo].[Payments] (
    [PaymentID] INT IDENTITY(1,1) NOT NULL,
    [PatientID] INT NOT NULL,
    [PrescriptionID] INT NULL,
    [MedicationRequestID] INT NULL,
    [Amount] DECIMAL(10,2) NOT NULL,
    [Status] NVARCHAR(20) NOT NULL DEFAULT 'Pending',
    [Method] NVARCHAR(50) NOT NULL,
    [TransactionRef] NVARCHAR(100) NULL,
    [PaymentDetails] NVARCHAR(500) NULL,
    [PaymentDate] DATETIME2 NOT NULL DEFAULT GETDATE(),
    [CompletedDate] DATETIME2 NULL,
    CONSTRAINT [PK_Payments] PRIMARY KEY CLUSTERED ([PaymentID] ASC),
    CONSTRAINT [FK_Payments_Patients] FOREIGN KEY ([PatientID]) 
        REFERENCES [dbo].[Patients] ([PatientID]) 
        ON DELETE RESTRICT,
    CONSTRAINT [FK_Payments_Prescriptions] FOREIGN KEY ([PrescriptionID]) 
        REFERENCES [dbo].[Prescriptions] ([PrescriptionID]) 
        ON DELETE RESTRICT,
    CONSTRAINT [FK_Payments_MedicationRequests] FOREIGN KEY ([MedicationRequestID]) 
        REFERENCES [dbo].[MedicationRequests] ([MedicationRequestID]) 
        ON DELETE RESTRICT
)
GO

-- Create indexes
CREATE NONCLUSTERED INDEX [IX_Payments_PatientID] ON [dbo].[Payments] ([PatientID] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_Payments_PrescriptionID] ON [dbo].[Payments] ([PrescriptionID] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_Payments_MedicationRequestID] ON [dbo].[Payments] ([MedicationRequestID] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_Payments_Status] ON [dbo].[Payments] ([Status] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_Payments_PaymentDate] ON [dbo].[Payments] ([PaymentDate] ASC)
GO

CREATE NONCLUSTERED INDEX [IX_Payments_TransactionRef] ON [dbo].[Payments] ([TransactionRef] ASC)
GO

PRINT 'Payments table created successfully!';
GO

-- =============================================
-- DOWN Migration (Rollback)
-- =============================================
-- To rollback this migration, run:
-- DROP TABLE IF EXISTS [dbo].[Payments];
-- =============================================

