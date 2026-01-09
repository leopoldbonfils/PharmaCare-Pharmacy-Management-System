-- =============================================
-- PharmaCare System - Complete Database Migration Script
-- =============================================
-- This script creates the complete database schema for the PharmaCare System
-- It includes all tables, relationships, indexes, and stored procedures
-- 
-- Created: 2025-01-12
-- Database: PharmaCareDB
-- 
-- IMPORTANT: Run this script on a fresh database or ensure all existing tables are dropped first
-- =============================================

USE [master]
GO

-- Create database if it doesn't exist
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'PharmaCareDB')
BEGIN
    CREATE DATABASE [PharmaCareDB]
    PRINT 'Database PharmaCareDB created successfully!';
END
ELSE
BEGIN
    PRINT 'Database PharmaCareDB already exists.';
END
GO

USE [PharmaCareDB]
GO

PRINT '';
PRINT '=============================================';
PRINT 'Starting Complete Database Migration';
PRINT '=============================================';
PRINT '';

-- =============================================
-- SECTION 1: DROP ALL EXISTING OBJECTS (ROLLBACK/FRESH START)
-- =============================================
PRINT 'Section 1: Dropping existing objects...';

-- Drop stored procedures first (no dependencies)
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_GetBestSellingMedicines')
    DROP PROCEDURE [dbo].[sp_GetBestSellingMedicines];
GO

IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_GetLowStockMedicines')
    DROP PROCEDURE [dbo].[sp_GetLowStockMedicines];
GO

IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_GetMessageThreads')
    DROP PROCEDURE [dbo].[sp_GetMessageThreads];
GO

IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_GetMonthlyRevenue')
    DROP PROCEDURE [dbo].[sp_GetMonthlyRevenue];
GO

IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_GetSalesReport')
    DROP PROCEDURE [dbo].[sp_GetSalesReport];
GO

IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_UpdateMedicineStock')
    DROP PROCEDURE [dbo].[sp_UpdateMedicineStock];
GO

-- Drop tables in reverse dependency order
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Messages')
    DROP TABLE [dbo].[Messages];
GO

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Notifications')
    DROP TABLE [dbo].[Notifications];
GO

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'SaleItems')
    DROP TABLE [dbo].[SaleItems];
GO

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Sales')
    DROP TABLE [dbo].[Sales];
GO

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Payments')
    DROP TABLE [dbo].[Payments];
GO

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'MedicationRequestItems')
    DROP TABLE [dbo].[MedicationRequestItems];
GO

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'MedicationRequests')
    DROP TABLE [dbo].[MedicationRequests];
GO

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'PrescriptionItems')
    DROP TABLE [dbo].[PrescriptionItems];
GO

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Prescriptions')
    DROP TABLE [dbo].[Prescriptions];
GO

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Medicines')
    DROP TABLE [dbo].[Medicines];
GO

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Patients')
    DROP TABLE [dbo].[Patients];
GO

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
    DROP TABLE [dbo].[Users];
GO

PRINT 'All existing objects dropped successfully!';
PRINT '';

-- =============================================
-- SECTION 2: CREATE TABLES (IN DEPENDENCY ORDER)
-- =============================================
PRINT 'Section 2: Creating tables...';
PRINT '';

-- =============================================
-- Table 1: Users
-- Description: Core user accounts for all system users (Administrators, Pharmacists, Patients)
-- =============================================
PRINT 'Creating table: Users...';

CREATE TABLE [dbo].[Users] (
    [UserID] INT IDENTITY(1,1) NOT NULL,
    [Username] NVARCHAR(50) NOT NULL,
    [PasswordHash] NVARCHAR(255) NOT NULL,
    [Email] NVARCHAR(100) NOT NULL,
    [Role] NVARCHAR(20) NOT NULL,  -- Administrator, Pharmacist, Patient
    [FirstName] NVARCHAR(50) NOT NULL,
    [LastName] NVARCHAR(50) NOT NULL,
    [PhoneNumber] NVARCHAR(20) NOT NULL,
    [IsActive] BIT NOT NULL DEFAULT 1,
    [CreatedDate] DATETIME2 NOT NULL DEFAULT GETDATE(),
    [LastLoginDate] DATETIME2 NULL,
    [ProfileImageUrl] NVARCHAR(500) NULL,
    
    CONSTRAINT [PK_Users] PRIMARY KEY CLUSTERED ([UserID] ASC),
    CONSTRAINT [UQ_Users_Username] UNIQUE NONCLUSTERED ([Username] ASC),
    CONSTRAINT [UQ_Users_Email] UNIQUE NONCLUSTERED ([Email] ASC)
);
GO

CREATE NONCLUSTERED INDEX [IX_Users_Role] ON [dbo].[Users] ([Role]);
CREATE NONCLUSTERED INDEX [IX_Users_IsActive] ON [dbo].[Users] ([IsActive]);
GO

PRINT '✓ Table Users created successfully!';
PRINT '';

-- =============================================
-- Table 2: Patients
-- Description: Patient-specific information linked to Users
-- Relationships: One-to-One with Users (optional)
-- =============================================
PRINT 'Creating table: Patients...';

CREATE TABLE [dbo].[Patients] (
    [PatientID] INT IDENTITY(1,1) NOT NULL,
    [UserID] INT NULL,  -- Optional link to Users table
    [FirstName] NVARCHAR(50) NOT NULL,
    [LastName] NVARCHAR(50) NOT NULL,
    [DateOfBirth] DATE NOT NULL,
    [Gender] NVARCHAR(10) NOT NULL,  -- Male, Female, Other
    [PhoneNumber] NVARCHAR(20) NOT NULL,
    [Email] NVARCHAR(100) NULL,
    [Address] NVARCHAR(200) NOT NULL,
    [District] NVARCHAR(50) NOT NULL,
    [Sector] NVARCHAR(50) NOT NULL,
    [EmergencyContact] NVARCHAR(20) NOT NULL,
    [EmergencyContactName] NVARCHAR(100) NOT NULL,
    [MedicalHistory] NVARCHAR(MAX) NULL,
    [Allergies] NVARCHAR(MAX) NULL,
    [BloodType] NVARCHAR(5) NULL,  -- A+, A-, B+, B-, AB+, AB-, O+, O-
    [IsActive] BIT NOT NULL DEFAULT 1,
    [CreatedDate] DATETIME2 NOT NULL DEFAULT GETDATE(),
    
    CONSTRAINT [PK_Patients] PRIMARY KEY CLUSTERED ([PatientID] ASC),
    CONSTRAINT [FK_Patients_Users] FOREIGN KEY ([UserID]) 
        REFERENCES [dbo].[Users] ([UserID]) 
        ON DELETE SET NULL
);
GO

CREATE NONCLUSTERED INDEX [IX_Patients_UserID] ON [dbo].[Patients] ([UserID]);
CREATE NONCLUSTERED INDEX [IX_Patients_IsActive] ON [dbo].[Patients] ([IsActive]);
GO

PRINT '✓ Table Patients created successfully!';
PRINT '';

-- =============================================
-- Table 3: Medicines
-- Description: Medicine inventory with stock management
-- =============================================
PRINT 'Creating table: Medicines...';

CREATE TABLE [dbo].[Medicines] (
    [MedicineID] INT IDENTITY(1,1) NOT NULL,
    [MedicineName] NVARCHAR(100) NOT NULL,
    [GenericName] NVARCHAR(100) NOT NULL,
    [Manufacturer] NVARCHAR(100) NOT NULL,
    [BatchNumber] NVARCHAR(50) NOT NULL,
    [ExpiryDate] DATE NOT NULL,
    [StockQuantity] INT NOT NULL DEFAULT 0,
    [ReorderLevel] INT NOT NULL DEFAULT 10,
    [Price] DECIMAL(10,2) NOT NULL,
    [Category] NVARCHAR(50) NOT NULL,
    [Dosage] NVARCHAR(50) NOT NULL,
    [Description] NVARCHAR(500) NULL,
    [IsActive] BIT NOT NULL DEFAULT 1,
    [CreatedDate] DATETIME2 NOT NULL DEFAULT GETDATE(),
    [LastUpdated] DATETIME2 NOT NULL DEFAULT GETDATE(),
    
    CONSTRAINT [PK_Medicines] PRIMARY KEY CLUSTERED ([MedicineID] ASC),
    CONSTRAINT [CK_Medicines_StockQuantity] CHECK ([StockQuantity] >= 0),
    CONSTRAINT [CK_Medicines_Price] CHECK ([Price] >= 0),
    CONSTRAINT [CK_Medicines_ReorderLevel] CHECK ([ReorderLevel] >= 0)
);
GO

CREATE NONCLUSTERED INDEX [IX_Medicines_Category] ON [dbo].[Medicines] ([Category]);
CREATE NONCLUSTERED INDEX [IX_Medicines_IsActive] ON [dbo].[Medicines] ([IsActive]);
CREATE NONCLUSTERED INDEX [IX_Medicines_StockQuantity] ON [dbo].[Medicines] ([StockQuantity]);
CREATE NONCLUSTERED INDEX [IX_Medicines_ExpiryDate] ON [dbo].[Medicines] ([ExpiryDate]);
GO

PRINT '✓ Table Medicines created successfully!';
PRINT '';

-- =============================================
-- Table 4: Prescriptions
-- Description: Prescription records from doctors
-- Relationships: Patient (Required), CreatedBy User (Required), DispensedBy User (Optional)
-- =============================================
PRINT 'Creating table: Prescriptions...';

CREATE TABLE [dbo].[Prescriptions] (
    [PrescriptionID] INT IDENTITY(1,1) NOT NULL,
    [PatientID] INT NOT NULL,
    [DoctorName] NVARCHAR(100) NOT NULL,
    [DoctorContact] NVARCHAR(20) NOT NULL,
    [HospitalName] NVARCHAR(100) NULL,
    [PrescriptionDate] DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    [Diagnosis] NVARCHAR(500) NOT NULL,
    [Status] NVARCHAR(20) NOT NULL DEFAULT 'Pending',  -- Pending, Dispensed, Cancelled
    [Instructions] NVARCHAR(MAX) NULL,
    [CreatedBy] INT NOT NULL,  -- UserID of the user who created the prescription
    [CreatedDate] DATETIME2 NOT NULL DEFAULT GETDATE(),
    [DispensedDate] DATETIME2 NULL,
    [DispensedBy] INT NULL,  -- UserID of the pharmacist who dispensed
    [PrescriptionImageUrl] NVARCHAR(500) NULL,
    
    CONSTRAINT [PK_Prescriptions] PRIMARY KEY CLUSTERED ([PrescriptionID] ASC),
    CONSTRAINT [FK_Prescriptions_Patients] FOREIGN KEY ([PatientID]) 
        REFERENCES [dbo].[Patients] ([PatientID]) 
        ON DELETE NO ACTION,
    CONSTRAINT [FK_Prescriptions_CreatedByUser] FOREIGN KEY ([CreatedBy]) 
        REFERENCES [dbo].[Users] ([UserID]) 
        ON DELETE NO ACTION,
    CONSTRAINT [FK_Prescriptions_DispensedByUser] FOREIGN KEY ([DispensedBy]) 
        REFERENCES [dbo].[Users] ([UserID]) 
        ON DELETE NO ACTION
);
GO

CREATE NONCLUSTERED INDEX [IX_Prescriptions_PatientID] ON [dbo].[Prescriptions] ([PatientID]);
CREATE NONCLUSTERED INDEX [IX_Prescriptions_CreatedBy] ON [dbo].[Prescriptions] ([CreatedBy]);
CREATE NONCLUSTERED INDEX [IX_Prescriptions_DispensedBy] ON [dbo].[Prescriptions] ([DispensedBy]);
CREATE NONCLUSTERED INDEX [IX_Prescriptions_Status] ON [dbo].[Prescriptions] ([Status]);
CREATE NONCLUSTERED INDEX [IX_Prescriptions_PrescriptionDate] ON [dbo].[Prescriptions] ([PrescriptionDate]);
GO

PRINT '✓ Table Prescriptions created successfully!';
PRINT '';

-- =============================================
-- Table 5: PrescriptionItems
-- Description: Individual medicine items in a prescription
-- Relationships: Prescription (Required), Medicine (Required)
-- =============================================
PRINT 'Creating table: PrescriptionItems...';

CREATE TABLE [dbo].[PrescriptionItems] (
    [PrescriptionItemID] INT IDENTITY(1,1) NOT NULL,
    [PrescriptionID] INT NOT NULL,
    [MedicineID] INT NOT NULL,
    [Dosage] NVARCHAR(50) NOT NULL,
    [Frequency] NVARCHAR(50) NOT NULL,
    [Duration] NVARCHAR(50) NOT NULL,
    [Quantity] INT NOT NULL,
    [Instructions] NVARCHAR(500) NULL,
    
    CONSTRAINT [PK_PrescriptionItems] PRIMARY KEY CLUSTERED ([PrescriptionItemID] ASC),
    CONSTRAINT [FK_PrescriptionItems_Prescriptions] FOREIGN KEY ([PrescriptionID]) 
        REFERENCES [dbo].[Prescriptions] ([PrescriptionID]) 
        ON DELETE CASCADE,
    CONSTRAINT [FK_PrescriptionItems_Medicines] FOREIGN KEY ([MedicineID]) 
        REFERENCES [dbo].[Medicines] ([MedicineID]) 
        ON DELETE NO ACTION,
    CONSTRAINT [CK_PrescriptionItems_Quantity] CHECK ([Quantity] > 0)
);
GO

CREATE NONCLUSTERED INDEX [IX_PrescriptionItems_PrescriptionID] ON [dbo].[PrescriptionItems] ([PrescriptionID]);
CREATE NONCLUSTERED INDEX [IX_PrescriptionItems_MedicineID] ON [dbo].[PrescriptionItems] ([MedicineID]);
GO

PRINT '✓ Table PrescriptionItems created successfully!';
PRINT '';

-- =============================================
-- Table 6: MedicationRequests
-- Description: Medication requests from patients to pharmacists
-- Relationships: Patient (Required), Pharmacist User (Required), ReviewedBy User (Optional), Prescription (Optional)
-- =============================================
PRINT 'Creating table: MedicationRequests...';

CREATE TABLE [dbo].[MedicationRequests] (
    [MedicationRequestID] INT IDENTITY(1,1) NOT NULL,
    [PatientID] INT NOT NULL,
    [PharmacistID] INT NOT NULL,  -- UserID of the assigned pharmacist
    [Symptoms] NVARCHAR(1000) NOT NULL,
    [ImageUrl] NVARCHAR(500) NULL,
    [Notes] NVARCHAR(1000) NULL,
    [PharmacistNotes] NVARCHAR(1000) NULL,
    [Status] NVARCHAR(20) NOT NULL DEFAULT 'Pending',  -- Pending, Reviewed, Approved, Rejected, Cancelled
    [PrescriptionID] INT NULL,  -- If converted to prescription
    [RequestDate] DATETIME2 NOT NULL DEFAULT GETDATE(),
    [ReviewedDate] DATETIME2 NULL,
    [ReviewedBy] INT NULL,  -- UserID of the user who reviewed
    
    CONSTRAINT [PK_MedicationRequests] PRIMARY KEY CLUSTERED ([MedicationRequestID] ASC),
    CONSTRAINT [FK_MedicationRequests_Patients] FOREIGN KEY ([PatientID]) 
        REFERENCES [dbo].[Patients] ([PatientID]) 
        ON DELETE NO ACTION,
    CONSTRAINT [FK_MedicationRequests_Pharmacists] FOREIGN KEY ([PharmacistID]) 
        REFERENCES [dbo].[Users] ([UserID]) 
        ON DELETE NO ACTION,
    CONSTRAINT [FK_MedicationRequests_ReviewedByUser] FOREIGN KEY ([ReviewedBy]) 
        REFERENCES [dbo].[Users] ([UserID]) 
        ON DELETE SET NULL,
    CONSTRAINT [FK_MedicationRequests_Prescriptions] FOREIGN KEY ([PrescriptionID]) 
        REFERENCES [dbo].[Prescriptions] ([PrescriptionID]) 
        ON DELETE SET NULL
);
GO

CREATE NONCLUSTERED INDEX [IX_MedicationRequests_PatientID] ON [dbo].[MedicationRequests] ([PatientID]);
CREATE NONCLUSTERED INDEX [IX_MedicationRequests_PharmacistID] ON [dbo].[MedicationRequests] ([PharmacistID]);
CREATE NONCLUSTERED INDEX [IX_MedicationRequests_ReviewedBy] ON [dbo].[MedicationRequests] ([ReviewedBy]);
CREATE NONCLUSTERED INDEX [IX_MedicationRequests_Status] ON [dbo].[MedicationRequests] ([Status]);
CREATE NONCLUSTERED INDEX [IX_MedicationRequests_RequestDate] ON [dbo].[MedicationRequests] ([RequestDate]);
GO

PRINT '✓ Table MedicationRequests created successfully!';
PRINT '';

-- =============================================
-- Table 7: MedicationRequestItems
-- Description: Individual medicine items requested in a medication request
-- Relationships: MedicationRequest (Required), Medicine (Required)
-- =============================================
PRINT 'Creating table: MedicationRequestItems...';

CREATE TABLE [dbo].[MedicationRequestItems] (
    [RequestItemID] INT IDENTITY(1,1) NOT NULL,
    [MedicationRequestID] INT NOT NULL,
    [MedicineID] INT NOT NULL,
    [RequestedQuantity] INT NOT NULL,
    [Notes] NVARCHAR(500) NULL,
    
    CONSTRAINT [PK_MedicationRequestItems] PRIMARY KEY CLUSTERED ([RequestItemID] ASC),
    CONSTRAINT [FK_MedicationRequestItems_MedicationRequests] FOREIGN KEY ([MedicationRequestID]) 
        REFERENCES [dbo].[MedicationRequests] ([MedicationRequestID]) 
        ON DELETE CASCADE,
    CONSTRAINT [FK_MedicationRequestItems_Medicines] FOREIGN KEY ([MedicineID]) 
        REFERENCES [dbo].[Medicines] ([MedicineID]) 
        ON DELETE NO ACTION,
    CONSTRAINT [CK_MedicationRequestItems_RequestedQuantity] CHECK ([RequestedQuantity] > 0)
);
GO

CREATE NONCLUSTERED INDEX [IX_MedicationRequestItems_MedicationRequestID] ON [dbo].[MedicationRequestItems] ([MedicationRequestID]);
CREATE NONCLUSTERED INDEX [IX_MedicationRequestItems_MedicineID] ON [dbo].[MedicationRequestItems] ([MedicineID]);
GO

PRINT '✓ Table MedicationRequestItems created successfully!';
PRINT '';

-- =============================================
-- Table 8: Sales
-- Description: Sales transactions
-- Relationships: Patient (Optional), SoldBy User (Required), MedicationRequest (Optional)
-- Special: InvoiceNumber should be generated automatically (may be computed column or trigger)
-- =============================================
PRINT 'Creating table: Sales...';

CREATE TABLE [dbo].[Sales] (
    [SaleID] INT IDENTITY(1,1) NOT NULL,
    [InvoiceNumber] NVARCHAR(50) NOT NULL,  -- Format: INV-YYYY-XXX (e.g., INV-2025-001)
    [PatientID] INT NULL,
    [TotalAmount] DECIMAL(10,2) NOT NULL,
    [PaymentMethod] NVARCHAR(20) NOT NULL,  -- Cash, MTN_MoMo, Airtel_Money, Credit_Card
    [PaymentStatus] NVARCHAR(20) NOT NULL DEFAULT 'Paid',  -- Paid, Pending, Failed, Refunded
    [SoldBy] INT NOT NULL,  -- UserID of the pharmacist who made the sale
    [SaleDate] DATETIME2 NOT NULL DEFAULT GETDATE(),
    [Notes] NVARCHAR(500) NULL,
    [PaymentReference] NVARCHAR(200) NULL,
    [PaymentDate] DATETIME2 NULL,
    [MedicationRequestID] INT NULL,  -- Link to medication request if sale came from request
    
    CONSTRAINT [PK_Sales] PRIMARY KEY CLUSTERED ([SaleID] ASC),
    CONSTRAINT [UQ_Sales_InvoiceNumber] UNIQUE NONCLUSTERED ([InvoiceNumber] ASC),
    CONSTRAINT [FK_Sales_Patients] FOREIGN KEY ([PatientID]) 
        REFERENCES [dbo].[Patients] ([PatientID]) 
        ON DELETE SET NULL,
    CONSTRAINT [FK_Sales_SoldByUser] FOREIGN KEY ([SoldBy]) 
        REFERENCES [dbo].[Users] ([UserID]) 
        ON DELETE NO ACTION,
    CONSTRAINT [FK_Sales_MedicationRequests] FOREIGN KEY ([MedicationRequestID]) 
        REFERENCES [dbo].[MedicationRequests] ([MedicationRequestID]) 
        ON DELETE SET NULL,
    CONSTRAINT [CK_Sales_TotalAmount] CHECK ([TotalAmount] >= 0)
);
GO

CREATE NONCLUSTERED INDEX [IX_Sales_PatientID] ON [dbo].[Sales] ([PatientID]);
CREATE NONCLUSTERED INDEX [IX_Sales_SoldBy] ON [dbo].[Sales] ([SoldBy]);
CREATE NONCLUSTERED INDEX [IX_Sales_MedicationRequestID] ON [dbo].[Sales] ([MedicationRequestID]);
CREATE NONCLUSTERED INDEX [IX_Sales_PaymentStatus] ON [dbo].[Sales] ([PaymentStatus]);
CREATE NONCLUSTERED INDEX [IX_Sales_SaleDate] ON [dbo].[Sales] ([SaleDate]);
GO

PRINT '✓ Table Sales created successfully!';
PRINT '';

-- =============================================
-- Table 9: SaleItems
-- Description: Individual medicine items in a sale
-- Relationships: Sale (Required), Medicine (Required)
-- =============================================
PRINT 'Creating table: SaleItems...';

CREATE TABLE [dbo].[SaleItems] (
    [SaleItemID] INT IDENTITY(1,1) NOT NULL,
    [SaleID] INT NOT NULL,
    [MedicineID] INT NOT NULL,
    [Quantity] INT NOT NULL,
    [UnitPrice] DECIMAL(10,2) NOT NULL,
    [TotalPrice] DECIMAL(10,2) NOT NULL,
    
    CONSTRAINT [PK_SaleItems] PRIMARY KEY CLUSTERED ([SaleItemID] ASC),
    CONSTRAINT [FK_SaleItems_Sales] FOREIGN KEY ([SaleID]) 
        REFERENCES [dbo].[Sales] ([SaleID]) 
        ON DELETE CASCADE,
    CONSTRAINT [FK_SaleItems_Medicines] FOREIGN KEY ([MedicineID]) 
        REFERENCES [dbo].[Medicines] ([MedicineID]) 
        ON DELETE NO ACTION,
    CONSTRAINT [CK_SaleItems_Quantity] CHECK ([Quantity] > 0),
    CONSTRAINT [CK_SaleItems_UnitPrice] CHECK ([UnitPrice] >= 0),
    CONSTRAINT [CK_SaleItems_TotalPrice] CHECK ([TotalPrice] >= 0)
);
GO

CREATE NONCLUSTERED INDEX [IX_SaleItems_SaleID] ON [dbo].[SaleItems] ([SaleID]);
CREATE NONCLUSTERED INDEX [IX_SaleItems_MedicineID] ON [dbo].[SaleItems] ([MedicineID]);
GO

PRINT '✓ Table SaleItems created successfully!';
PRINT '';

-- =============================================
-- Table 10: Payments
-- Description: Payment records for prescriptions or medication requests
-- Relationships: Patient (Required), Prescription (Optional), MedicationRequest (Optional)
-- =============================================
PRINT 'Creating table: Payments...';

CREATE TABLE [dbo].[Payments] (
    [PaymentID] INT IDENTITY(1,1) NOT NULL,
    [PatientID] INT NOT NULL,
    [PrescriptionID] INT NULL,  -- Optional - can pay for prescription or medication request
    [MedicationRequestID] INT NULL,  -- Optional - for direct medication request payments
    [Amount] DECIMAL(10,2) NOT NULL,
    [Status] NVARCHAR(20) NOT NULL DEFAULT 'Pending',  -- Pending, Completed, Failed, Refunded
    [Method] NVARCHAR(50) NOT NULL,  -- MTN_MoMo, Airtel_Money, Credit_Card, Cash
    [TransactionRef] NVARCHAR(100) NULL,
    [PaymentDetails] NVARCHAR(500) NULL,
    [PaymentDate] DATETIME2 NOT NULL DEFAULT GETDATE(),
    [CompletedDate] DATETIME2 NULL,
    
    CONSTRAINT [PK_Payments] PRIMARY KEY CLUSTERED ([PaymentID] ASC),
    CONSTRAINT [FK_Payments_Patients] FOREIGN KEY ([PatientID]) 
        REFERENCES [dbo].[Patients] ([PatientID]) 
        ON DELETE NO ACTION,
    CONSTRAINT [FK_Payments_Prescriptions] FOREIGN KEY ([PrescriptionID]) 
        REFERENCES [dbo].[Prescriptions] ([PrescriptionID]) 
        ON DELETE NO ACTION,
    CONSTRAINT [FK_Payments_MedicationRequests] FOREIGN KEY ([MedicationRequestID]) 
        REFERENCES [dbo].[MedicationRequests] ([MedicationRequestID]) 
        ON DELETE NO ACTION,
    CONSTRAINT [CK_Payments_Amount] CHECK ([Amount] >= 0),
    CONSTRAINT [CK_Payments_PrescriptionOrRequest] CHECK (
        ([PrescriptionID] IS NOT NULL AND [MedicationRequestID] IS NULL) OR 
        ([PrescriptionID] IS NULL AND [MedicationRequestID] IS NOT NULL) OR
        ([PrescriptionID] IS NULL AND [MedicationRequestID] IS NULL)
    )
);
GO

CREATE NONCLUSTERED INDEX [IX_Payments_PatientID] ON [dbo].[Payments] ([PatientID]);
CREATE NONCLUSTERED INDEX [IX_Payments_PrescriptionID] ON [dbo].[Payments] ([PrescriptionID]);
CREATE NONCLUSTERED INDEX [IX_Payments_MedicationRequestID] ON [dbo].[Payments] ([MedicationRequestID]);
CREATE NONCLUSTERED INDEX [IX_Payments_Status] ON [dbo].[Payments] ([Status]);
CREATE NONCLUSTERED INDEX [IX_Payments_TransactionRef] ON [dbo].[Payments] ([TransactionRef]);
CREATE NONCLUSTERED INDEX [IX_Payments_PaymentDate] ON [dbo].[Payments] ([PaymentDate]);
GO

PRINT '✓ Table Payments created successfully!';
PRINT '';

-- =============================================
-- Table 11: Notifications
-- Description: System notifications for users
-- Relationships: User (Required)
-- =============================================
PRINT 'Creating table: Notifications...';

CREATE TABLE [dbo].[Notifications] (
    [NotificationID] INT IDENTITY(1,1) NOT NULL,
    [UserID] INT NOT NULL,
    [Title] NVARCHAR(200) NOT NULL,
    [Message] NVARCHAR(1000) NOT NULL,
    [Type] NVARCHAR(50) NOT NULL,  -- Message, Prescription, Payment, System, Info, Success, Warning, Error
    [RelatedEntityType] NVARCHAR(50) NULL,  -- MedicationRequest, Prescription, Payment, Message
    [RelatedEntityID] INT NULL,
    [RelatedID] INT NULL,  -- For backward compatibility and MessageID
    [IsRead] BIT NOT NULL DEFAULT 0,
    [CreatedDate] DATETIME2 NOT NULL DEFAULT GETDATE(),
    [ReadDate] DATETIME2 NULL,
    [ActionUrl] NVARCHAR(200) NULL,
    
    CONSTRAINT [PK_Notifications] PRIMARY KEY CLUSTERED ([NotificationID] ASC),
    CONSTRAINT [FK_Notifications_Users] FOREIGN KEY ([UserID]) 
        REFERENCES [dbo].[Users] ([UserID]) 
        ON DELETE CASCADE
);
GO

CREATE NONCLUSTERED INDEX [IX_Notifications_UserID] ON [dbo].[Notifications] ([UserID]);
CREATE NONCLUSTERED INDEX [IX_Notifications_IsRead] ON [dbo].[Notifications] ([IsRead]);
CREATE NONCLUSTERED INDEX [IX_Notifications_CreatedDate] ON [dbo].[Notifications] ([CreatedDate]);
CREATE NONCLUSTERED INDEX [IX_Notifications_RelatedEntity] ON [dbo].[Notifications] ([RelatedEntityType], [RelatedEntityID]);
GO

PRINT '✓ Table Notifications created successfully!';
PRINT '';

-- =============================================
-- Table 12: Messages
-- Description: Direct messages between users
-- Relationships: Sender User (Required), Receiver User (Required), Prescription (Optional), ReplyToMessage (Optional)
-- =============================================
PRINT 'Creating table: Messages...';

CREATE TABLE [dbo].[Messages] (
    [MessageID] INT IDENTITY(1,1) NOT NULL,
    [SenderID] INT NOT NULL,
    [ReceiverID] INT NOT NULL,
    [PrescriptionID] INT NULL,
    [MessageText] NVARCHAR(MAX) NOT NULL,
    [IsRead] BIT NOT NULL DEFAULT 0,
    [SentDate] DATETIME2 NOT NULL DEFAULT GETDATE(),
    [ReadDate] DATETIME2 NULL,
    [MessageType] NVARCHAR(20) NOT NULL DEFAULT 'General',  -- General, Prescription, SideEffect, Dosage, Emergency
    [ReplyToMessageID] INT NULL,
    [AttachmentUrl] NVARCHAR(500) NULL,
    [AttachmentFileName] NVARCHAR(255) NULL,
    [AttachmentFileType] NVARCHAR(50) NULL,
    
    CONSTRAINT [PK_Messages] PRIMARY KEY CLUSTERED ([MessageID] ASC),
    CONSTRAINT [FK_Messages_Sender] FOREIGN KEY ([SenderID]) 
        REFERENCES [dbo].[Users] ([UserID]) 
        ON DELETE NO ACTION,
    CONSTRAINT [FK_Messages_Receiver] FOREIGN KEY ([ReceiverID]) 
        REFERENCES [dbo].[Users] ([UserID]) 
        ON DELETE NO ACTION,
    CONSTRAINT [FK_Messages_Prescriptions] FOREIGN KEY ([PrescriptionID]) 
        REFERENCES [dbo].[Prescriptions] ([PrescriptionID]) 
        ON DELETE SET NULL,
    CONSTRAINT [FK_Messages_ReplyToMessage] FOREIGN KEY ([ReplyToMessageID]) 
        REFERENCES [dbo].[Messages] ([MessageID]) 
        ON DELETE NO ACTION,
    CONSTRAINT [CK_Messages_SenderReceiver] CHECK ([SenderID] <> [ReceiverID])
);
GO

CREATE NONCLUSTERED INDEX [IX_Messages_SenderID] ON [dbo].[Messages] ([SenderID]);
CREATE NONCLUSTERED INDEX [IX_Messages_ReceiverID] ON [dbo].[Messages] ([ReceiverID]);
CREATE NONCLUSTERED INDEX [IX_Messages_PrescriptionID] ON [dbo].[Messages] ([PrescriptionID]);
CREATE NONCLUSTERED INDEX [IX_Messages_ReplyToMessageID] ON [dbo].[Messages] ([ReplyToMessageID]);
CREATE NONCLUSTERED INDEX [IX_Messages_IsRead] ON [dbo].[Messages] ([IsRead]);
CREATE NONCLUSTERED INDEX [IX_Messages_SentDate] ON [dbo].[Messages] ([SentDate]);
GO

PRINT '✓ Table Messages created successfully!';
PRINT '';
GO

-- =============================================
-- SECTION 3: CREATE STORED PROCEDURES
-- =============================================
PRINT 'Section 3: Creating stored procedures...';
PRINT '';
GO

-- =============================================
-- Stored Procedure: sp_GetBestSellingMedicines
-- Description: Retrieves best selling medicines with sales statistics
-- Parameters:
--   @TopN - Number of top medicines to return (default: 10)
--   @StartDate - Start date filter (optional)
--   @EndDate - End date filter (optional)
-- =============================================
PRINT 'Creating stored procedure: sp_GetBestSellingMedicines...';
GO

CREATE PROCEDURE [dbo].[sp_GetBestSellingMedicines]
    @TopN INT = 10,
    @StartDate DATETIME2 NULL = NULL,
    @EndDate DATETIME2 NULL = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@TopN)
        m.[MedicineID],
        m.[MedicineName],
        m.[GenericName],
        m.[Category],
        SUM(si.[Quantity]) AS [TotalQuantitySold],
        SUM(si.[TotalPrice]) AS [TotalRevenue],
        COUNT(DISTINCT s.[SaleID]) AS [SaleCount]
    FROM [dbo].[Medicines] m
    INNER JOIN [dbo].[SaleItems] si ON si.[MedicineID] = m.[MedicineID]
    INNER JOIN [dbo].[Sales] s ON s.[SaleID] = si.[SaleID]
    WHERE 
        m.[IsActive] = 1
        AND (@StartDate IS NULL OR s.[SaleDate] >= @StartDate)
        AND (@EndDate IS NULL OR s.[SaleDate] <= @EndDate)
    GROUP BY 
        m.[MedicineID],
        m.[MedicineName],
        m.[GenericName],
        m.[Category]
    ORDER BY [TotalRevenue] DESC;
END
GO

PRINT '✓ Stored procedure sp_GetBestSellingMedicines created successfully!';
PRINT '';
GO

-- =============================================
-- Stored Procedure: sp_GetLowStockMedicines
-- Description: Retrieves all medicines that are at or below reorder level
-- Parameters: None
-- =============================================
PRINT 'Creating stored procedure: sp_GetLowStockMedicines...';
GO

CREATE PROCEDURE [dbo].[sp_GetLowStockMedicines]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        [MedicineID],
        [MedicineName],
        [GenericName],
        [Category],
        [StockQuantity],
        [ReorderLevel],
        [Price],
        [IsActive]
    FROM [dbo].[Medicines]
    WHERE [IsActive] = 1 
        AND [StockQuantity] <= [ReorderLevel]
    ORDER BY [StockQuantity] ASC, [MedicineName] ASC;
END
GO

PRINT '✓ Stored procedure sp_GetLowStockMedicines created successfully!';
PRINT '';
GO

-- =============================================
-- Stored Procedure: sp_GetMessageThreads
-- Description: Retrieves message threads/conversations for a specific user
-- Parameters: @UserID - The ID of the user to get threads for
-- =============================================
PRINT 'Creating stored procedure: sp_GetMessageThreads...';
GO

CREATE PROCEDURE [dbo].[sp_GetMessageThreads]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT DISTINCT
        CASE 
            WHEN m.[SenderID] = @UserID THEN m.[ReceiverID]
            ELSE m.[SenderID]
        END AS [OtherUserID],
        CASE 
            WHEN m.[SenderID] = @UserID THEN r.[FirstName] + ' ' + r.[LastName]
            ELSE s.[FirstName] + ' ' + s.[LastName]
        END AS [OtherUserName],
        CASE 
            WHEN m.[SenderID] = @UserID THEN r.[Role]
            ELSE s.[Role]
        END AS [OtherUserRole],
        CASE 
            WHEN m.[SenderID] = @UserID THEN r.[ProfileImageUrl]
            ELSE s.[ProfileImageUrl]
        END AS [OtherUserImage],
        (SELECT COUNT(*) FROM [Messages] WHERE [ReceiverID] = @UserID AND [SenderID] = CASE WHEN m.[SenderID] = @UserID THEN m.[ReceiverID] ELSE m.[SenderID] END AND [IsRead] = 0) AS [UnreadCount],
        (SELECT TOP 1 [MessageText] FROM [Messages] WHERE ([SenderID] = @UserID AND [ReceiverID] = CASE WHEN m.[SenderID] = @UserID THEN m.[ReceiverID] ELSE m.[SenderID] END) OR ([ReceiverID] = @UserID AND [SenderID] = CASE WHEN m.[SenderID] = @UserID THEN m.[ReceiverID] ELSE m.[SenderID] END) ORDER BY [SentDate] DESC) AS [LastMessage],
        (SELECT TOP 1 [SentDate] FROM [Messages] WHERE ([SenderID] = @UserID AND [ReceiverID] = CASE WHEN m.[SenderID] = @UserID THEN m.[ReceiverID] ELSE m.[SenderID] END) OR ([ReceiverID] = @UserID AND [SenderID] = CASE WHEN m.[SenderID] = @UserID THEN m.[ReceiverID] ELSE m.[SenderID] END) ORDER BY [SentDate] DESC) AS [LastMessageDate]
    FROM [Messages] m
    INNER JOIN [Users] s ON s.[UserID] = m.[SenderID]
    INNER JOIN [Users] r ON r.[UserID] = m.[ReceiverID]
    WHERE m.[SenderID] = @UserID OR m.[ReceiverID] = @UserID
    ORDER BY [LastMessageDate] DESC;
END
GO

PRINT '✓ Stored procedure sp_GetMessageThreads created successfully!';
PRINT '';
GO

-- =============================================
-- Stored Procedure: sp_GetMonthlyRevenue
-- Description: Generates monthly revenue report
-- Parameters:
--   @StartDate - Start date for report (optional)
--   @EndDate - End date for report (optional)
-- =============================================
PRINT 'Creating stored procedure: sp_GetMonthlyRevenue...';
GO

CREATE PROCEDURE [dbo].[sp_GetMonthlyRevenue]
    @StartDate DATETIME2 NULL = NULL,
    @EndDate DATETIME2 NULL = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        YEAR(s.[SaleDate]) AS [Year],
        MONTH(s.[SaleDate]) AS [Month],
        SUM(s.[TotalAmount]) AS [Revenue],
        COUNT(s.[SaleID]) AS [SalesCount],
        COUNT(DISTINCT s.[PatientID]) AS [PatientCount]
    FROM [dbo].[Sales] s
    WHERE 
        s.[PaymentStatus] = 'Paid'
        AND (@StartDate IS NULL OR s.[SaleDate] >= @StartDate)
        AND (@EndDate IS NULL OR s.[SaleDate] <= @EndDate)
    GROUP BY 
        YEAR(s.[SaleDate]),
        MONTH(s.[SaleDate])
    ORDER BY 
        [Year] DESC,
        [Month] DESC;
END
GO

PRINT '✓ Stored procedure sp_GetMonthlyRevenue created successfully!';
PRINT '';
GO

-- =============================================
-- Stored Procedure: sp_GetSalesReport
-- Description: Generates sales report with filtering options
-- Parameters: 
--   @StartDate - Start date for report (optional)
--   @EndDate - End date for report (optional)
--   @PharmacistID - Filter by pharmacist (optional, NULL = all)
-- =============================================
PRINT 'Creating stored procedure: sp_GetSalesReport...';
GO

CREATE PROCEDURE [dbo].[sp_GetSalesReport]
    @StartDate DATETIME2 NULL = NULL,
    @EndDate DATETIME2 NULL = NULL,
    @PharmacistID INT NULL = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        s.[SaleID],
        s.[InvoiceNumber],
        s.[SaleDate],
        s.[TotalAmount],
        s.[PaymentMethod],
        s.[PaymentStatus],
        u.[FirstName] + ' ' + u.[LastName] AS [SoldByName],
        p.[FirstName] + ' ' + p.[LastName] AS [PatientName],
        (SELECT COUNT(*) FROM [SaleItems] WHERE [SaleID] = s.[SaleID]) AS [ItemCount]
    FROM [dbo].[Sales] s
    INNER JOIN [dbo].[Users] u ON u.[UserID] = s.[SoldBy]
    LEFT JOIN [dbo].[Patients] p ON p.[PatientID] = s.[PatientID]
    WHERE 
        (@StartDate IS NULL OR s.[SaleDate] >= @StartDate)
        AND (@EndDate IS NULL OR s.[SaleDate] <= @EndDate)
        AND (@PharmacistID IS NULL OR s.[SoldBy] = @PharmacistID)
    ORDER BY s.[SaleDate] DESC;
END
GO

PRINT '✓ Stored procedure sp_GetSalesReport created successfully!';
PRINT '';
GO

-- =============================================
-- Stored Procedure: sp_UpdateMedicineStock
-- Description: Updates medicine stock quantity and last updated timestamp
-- Parameters:
--   @MedicineID - ID of the medicine to update
--   @QuantityChange - Amount to add/subtract from stock (can be negative)
--   @NewLastUpdated - Optional new LastUpdated timestamp (defaults to GETDATE())
-- Returns: Updated stock quantity
-- =============================================
PRINT 'Creating stored procedure: sp_UpdateMedicineStock...';
GO

CREATE PROCEDURE [dbo].[sp_UpdateMedicineStock]
    @MedicineID INT,
    @QuantityChange INT,
    @NewLastUpdated DATETIME2 NULL = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @UpdatedStock INT;
    DECLARE @UpdateDate DATETIME2 = ISNULL(@NewLastUpdated, GETDATE());
    
    UPDATE [dbo].[Medicines]
    SET 
        [StockQuantity] = [StockQuantity] + @QuantityChange,
        [LastUpdated] = @UpdateDate
    WHERE [MedicineID] = @MedicineID;
    
    SELECT @UpdatedStock = [StockQuantity]
    FROM [dbo].[Medicines]
    WHERE [MedicineID] = @MedicineID;
    
    SELECT @UpdatedStock AS [NewStockQuantity];
END
GO

PRINT '✓ Stored procedure sp_UpdateMedicineStock created successfully!';
PRINT '';

-- =============================================
-- SECTION 4: SUMMARY AND VERIFICATION
-- =============================================
PRINT '';
PRINT '=============================================';
PRINT 'Migration Complete!';
PRINT '=============================================';
PRINT '';

-- Verify all tables were created
PRINT 'Verifying table creation:';
SELECT 
    TABLE_NAME,
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = t.TABLE_NAME) AS ColumnCount
FROM INFORMATION_SCHEMA.TABLES t
WHERE TABLE_TYPE = 'BASE TABLE' 
    AND TABLE_SCHEMA = 'dbo'
    AND TABLE_NAME IN ('Users', 'Patients', 'Medicines', 'Prescriptions', 'PrescriptionItems', 
                       'MedicationRequests', 'MedicationRequestItems', 'Sales', 'SaleItems', 
                       'Payments', 'Notifications', 'Messages')
ORDER BY TABLE_NAME;
GO

-- Verify all stored procedures were created
PRINT '';
PRINT 'Verifying stored procedure creation:';
SELECT 
    ROUTINE_NAME,
    ROUTINE_TYPE
FROM INFORMATION_SCHEMA.ROUTINES
WHERE ROUTINE_SCHEMA = 'dbo'
    AND ROUTINE_TYPE = 'PROCEDURE'
    AND ROUTINE_NAME LIKE 'sp_%'
ORDER BY ROUTINE_NAME;
GO

PRINT '';
PRINT '=============================================';
PRINT 'Database migration completed successfully!';
PRINT '=============================================';
PRINT '';
PRINT 'Next Steps:';
PRINT '1. Verify all tables and procedures were created correctly';
PRINT '2. Create initial admin user';
PRINT '3. Seed initial data if needed';
PRINT '4. Configure InvoiceNumber generation (if using computed column or trigger)';
PRINT '';
GO

