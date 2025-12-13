-- =============================================
-- PharmaCare System - Medication Request & Payment Tables
-- Migration Script
-- =============================================
-- This script creates the MedicationRequest, MedicationRequestItem, and Payment tables
-- Run this script on your PharmaCareDB database

USE [PharmaCareDB]
GO

-- =============================================
-- 1. Create MedicationRequest Table
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[MedicationRequests]') AND type in (N'U'))
BEGIN
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
        CONSTRAINT [FK_MedicationRequests_Patients] FOREIGN KEY ([PatientID]) REFERENCES [dbo].[Patients] ([PatientID]),
        CONSTRAINT [FK_MedicationRequests_Users_Pharmacist] FOREIGN KEY ([PharmacistID]) REFERENCES [dbo].[Users] ([UserID]),
        CONSTRAINT [FK_MedicationRequests_Users_ReviewedBy] FOREIGN KEY ([ReviewedBy]) REFERENCES [dbo].[Users] ([UserID]),
        CONSTRAINT [FK_MedicationRequests_Prescriptions] FOREIGN KEY ([PrescriptionID]) REFERENCES [dbo].[Prescriptions] ([PrescriptionID])
    );
    
    CREATE INDEX [IX_MedicationRequests_PatientID] ON [dbo].[MedicationRequests] ([PatientID]);
    CREATE INDEX [IX_MedicationRequests_PharmacistID] ON [dbo].[MedicationRequests] ([PharmacistID]);
    CREATE INDEX [IX_MedicationRequests_Status] ON [dbo].[MedicationRequests] ([Status]);
    
    PRINT 'MedicationRequests table created successfully.';
END
ELSE
BEGIN
    PRINT 'MedicationRequests table already exists.';
END
GO

-- =============================================
-- 2. Create MedicationRequestItem Table
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[MedicationRequestItems]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[MedicationRequestItems] (
        [RequestItemID] INT IDENTITY(1,1) NOT NULL,
        [MedicationRequestID] INT NOT NULL,
        [MedicineID] INT NOT NULL,
        [RequestedQuantity] INT NOT NULL,
        [Notes] NVARCHAR(500) NULL,
        CONSTRAINT [PK_MedicationRequestItems] PRIMARY KEY CLUSTERED ([RequestItemID] ASC),
        CONSTRAINT [FK_MedicationRequestItems_MedicationRequests] FOREIGN KEY ([MedicationRequestID]) REFERENCES [dbo].[MedicationRequests] ([MedicationRequestID]) ON DELETE CASCADE,
        CONSTRAINT [FK_MedicationRequestItems_Medicines] FOREIGN KEY ([MedicineID]) REFERENCES [dbo].[Medicines] ([MedicineID])
    );
    
    CREATE INDEX [IX_MedicationRequestItems_MedicationRequestID] ON [dbo].[MedicationRequestItems] ([MedicationRequestID]);
    CREATE INDEX [IX_MedicationRequestItems_MedicineID] ON [dbo].[MedicationRequestItems] ([MedicineID]);
    
    PRINT 'MedicationRequestItems table created successfully.';
END
ELSE
BEGIN
    PRINT 'MedicationRequestItems table already exists.';
END
GO

-- =============================================
-- 3. Create Payment Table
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Payments]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Payments] (
        [PaymentID] INT IDENTITY(1,1) NOT NULL,
        [PatientID] INT NOT NULL,
        [PrescriptionID] INT NOT NULL,
        [Amount] DECIMAL(10,2) NOT NULL,
        [Status] NVARCHAR(20) NOT NULL DEFAULT 'Pending',
        [Method] NVARCHAR(50) NOT NULL,
        [TransactionRef] NVARCHAR(100) NULL,
        [PaymentDetails] NVARCHAR(500) NULL,
        [PaymentDate] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [CompletedDate] DATETIME2 NULL,
        CONSTRAINT [PK_Payments] PRIMARY KEY CLUSTERED ([PaymentID] ASC),
        CONSTRAINT [FK_Payments_Patients] FOREIGN KEY ([PatientID]) REFERENCES [dbo].[Patients] ([PatientID]),
        CONSTRAINT [FK_Payments_Prescriptions] FOREIGN KEY ([PrescriptionID]) REFERENCES [dbo].[Prescriptions] ([PrescriptionID])
    );
    
    CREATE INDEX [IX_Payments_PatientID] ON [dbo].[Payments] ([PatientID]);
    CREATE INDEX [IX_Payments_PrescriptionID] ON [dbo].[Payments] ([PrescriptionID]);
    CREATE INDEX [IX_Payments_Status] ON [dbo].[Payments] ([Status]);
    CREATE INDEX [IX_Payments_TransactionRef] ON [dbo].[Payments] ([TransactionRef]);
    
    PRINT 'Payments table created successfully.';
END
ELSE
BEGIN
    PRINT 'Payments table already exists.';
END
GO

-- =============================================
-- Migration Complete
-- =============================================
PRINT '=============================================';
PRINT 'Database migration completed successfully!';
PRINT 'MedicationRequest and Payment tables are ready.';
PRINT '=============================================';

