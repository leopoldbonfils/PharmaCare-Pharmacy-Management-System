using Microsoft.EntityFrameworkCore;
using PharmaCareSystem.Api.Data;
using PharmaCareSystem.Api.Models;
using PharmaCareSystem.Api.DTOs.Sales;
using PharmaCareSystem.Api.Helpers;

namespace PharmaCareSystem.Api.Services
{
    public interface ISaleService
    {
        Task<List<SaleDto>> GetAllSalesAsync();
        Task<SaleDto?> GetSaleByIdAsync(int saleId);
        Task<List<SaleDto>> GetSalesByPatientAsync(int patientId);
        Task<(bool Success, string Message, SaleDto? Data)> CreateSaleAsync(CreateSaleDto dto, int soldBy);
        Task<(bool Success, string Message, SaleDto? Data)> CompleteSaleFromMedicationRequestAsync(int medicationRequestId, int soldBy);
    }

    public class SaleService : ISaleService
    {
        private readonly PharmaCareDbContext _context;

        public SaleService(PharmaCareDbContext context)
        {
            _context = context;
        }

        public async Task<List<SaleDto>> GetAllSalesAsync()
        {
            return await _context.Sales
                .Include(s => s.Patient)
                .Include(s => s.SoldByUser)
                .Include(s => s.SaleItems)
                    .ThenInclude(si => si.Medicine)
                .Select(s => new SaleDto
                {
                    SaleID = s.SaleID,
                    InvoiceNumber = s.InvoiceNumber,
                    PatientID = s.PatientID,
                    PatientName = s.Patient != null ? s.Patient.FirstName + " " + s.Patient.LastName : "Walk-in Customer",
                    TotalAmount = s.TotalAmount,
                    PaymentMethod = s.PaymentMethod,
                    PaymentStatus = s.PaymentStatus,
                    SoldBy = s.SoldBy,
                    SoldByName = s.SoldByUser.FirstName + " " + s.SoldByUser.LastName,
                    SaleDate = s.SaleDate,
                    Notes = s.Notes,
                    Items = s.SaleItems.Select(si => new SaleItemDto
                    {
                        SaleItemID = si.SaleItemID,
                        MedicineID = si.MedicineID,
                        MedicineName = si.Medicine.MedicineName,
                        GenericName = si.Medicine.GenericName,
                        Dosage = si.Medicine.Dosage,
                        Quantity = si.Quantity,
                        UnitPrice = si.UnitPrice,
                        TotalPrice = si.TotalPrice
                    }).ToList()
                })
                .OrderByDescending(s => s.SaleDate)
                .ToListAsync();
        }

        public async Task<SaleDto?> GetSaleByIdAsync(int saleId)
        {
            return await _context.Sales
                .Include(s => s.Patient)
                .Include(s => s.SoldByUser)
                .Include(s => s.SaleItems)
                    .ThenInclude(si => si.Medicine)
                .Where(s => s.SaleID == saleId)
                .Select(s => new SaleDto
                {
                    SaleID = s.SaleID,
                    InvoiceNumber = s.InvoiceNumber,
                    PatientID = s.PatientID,
                    PatientName = s.Patient != null ? s.Patient.FirstName + " " + s.Patient.LastName : "Walk-in Customer",
                    TotalAmount = s.TotalAmount,
                    PaymentMethod = s.PaymentMethod,
                    PaymentStatus = s.PaymentStatus,
                    SoldBy = s.SoldBy,
                    SoldByName = s.SoldByUser.FirstName + " " + s.SoldByUser.LastName,
                    SaleDate = s.SaleDate,
                    Notes = s.Notes,
                    Items = s.SaleItems.Select(si => new SaleItemDto
                    {
                        SaleItemID = si.SaleItemID,
                        MedicineID = si.MedicineID,
                        MedicineName = si.Medicine.MedicineName,
                        GenericName = si.Medicine.GenericName,
                        Dosage = si.Medicine.Dosage,
                        Quantity = si.Quantity,
                        UnitPrice = si.UnitPrice,
                        TotalPrice = si.TotalPrice
                    }).ToList()
                })
                .FirstOrDefaultAsync();
        }

        public async Task<List<SaleDto>> GetSalesByPatientAsync(int patientId)
        {
            return await _context.Sales
                .Include(s => s.Patient)
                .Include(s => s.SoldByUser)
                .Include(s => s.SaleItems)
                    .ThenInclude(si => si.Medicine)
                .Where(s => s.PatientID == patientId)
                .Select(s => new SaleDto
                {
                    SaleID = s.SaleID,
                    InvoiceNumber = s.InvoiceNumber,
                    PatientID = s.PatientID,
                    PatientName = s.Patient!.FirstName + " " + s.Patient.LastName,
                    TotalAmount = s.TotalAmount,
                    PaymentMethod = s.PaymentMethod,
                    PaymentStatus = s.PaymentStatus,
                    SoldBy = s.SoldBy,
                    SoldByName = s.SoldByUser.FirstName + " " + s.SoldByUser.LastName,
                    SaleDate = s.SaleDate,
                    Notes = s.Notes,
                    Items = s.SaleItems.Select(si => new SaleItemDto
                    {
                        SaleItemID = si.SaleItemID,
                        MedicineID = si.MedicineID,
                        MedicineName = si.Medicine.MedicineName,
                        GenericName = si.Medicine.GenericName,
                        Dosage = si.Medicine.Dosage,
                        Quantity = si.Quantity,
                        UnitPrice = si.UnitPrice,
                        TotalPrice = si.TotalPrice
                    }).ToList()
                })
                .OrderByDescending(s => s.SaleDate)
                .ToListAsync();
        }

        public async Task<(bool Success, string Message, SaleDto? Data)> CreateSaleAsync(CreateSaleDto dto, int soldBy)
        {
            var strategy = _context.Database.CreateExecutionStrategy();
            
            return await strategy.ExecuteAsync(async () =>
            {
                try
                {
                    // Generate invoice number
                    var lastSale = await _context.Sales
                        .OrderByDescending(s => s.SaleID)
                        .FirstOrDefaultAsync();
                    
                    var lastNumber = 0;
                    if (lastSale != null && lastSale.InvoiceNumber.StartsWith($"INV-{DateTime.Now.Year}"))
                    {
                        var parts = lastSale.InvoiceNumber.Split('-');
                        if (parts.Length == 3)
                            int.TryParse(parts[2], out lastNumber);
                    }

                    var invoiceNumber = InvoiceGenerator.GenerateInvoiceNumber(lastNumber);

                    // Validate medicines and calculate total
                    decimal totalAmount = 0;
                    var medicines = new List<(Medicine Medicine, int Quantity)>();
                    
                    foreach (var item in dto.Items)
                    {
                        var medicine = await _context.Medicines.FindAsync(item.MedicineID);
                        if (medicine == null)
                            return (false, $"Medicine with ID {item.MedicineID} not found", null);

                        if (medicine.StockQuantity < item.Quantity)
                            return (false, $"Insufficient stock for {medicine.MedicineName}", null);

                        totalAmount += medicine.Price * item.Quantity;
                        medicines.Add((medicine, item.Quantity));
                    }

                    // Create sale entity
                    // Note: If InvoiceNumber is computed in DB, we'll handle it separately
                    var sale = new Sale
                    {
                        InvoiceNumber = invoiceNumber, // Will be ignored if computed
                        PatientID = dto.PatientID,
                        TotalAmount = totalAmount,
                        PaymentMethod = dto.PaymentMethod,
                        PaymentStatus = "Paid",
                        SoldBy = soldBy,
                        Notes = dto.Notes,
                        SaleDate = DateTime.Now
                    };

                    _context.Sales.Add(sale);

                    // Create sale items and update stock (all in memory first)
                    foreach (var (medicine, quantity) in medicines)
                    {
                        var saleItem = new SaleItem
                        {
                            Sale = sale, // Use navigation property - EF Core will set SaleID
                            MedicineID = medicine.MedicineID,
                            Quantity = quantity,
                            UnitPrice = medicine.Price,
                            TotalPrice = medicine.Price * quantity
                        };
                        _context.SaleItems.Add(saleItem);

                        // Update stock
                        medicine.StockQuantity -= quantity;
                        medicine.LastUpdated = DateTime.Now;
                    }

                    // Single SaveChangesAsync for all operations (sale + saleItems + stock updates)
                    try
                    {
                        await _context.SaveChangesAsync();
                    }
                    catch (Microsoft.EntityFrameworkCore.DbUpdateException ex) when (ex.InnerException is Microsoft.Data.SqlClient.SqlException sqlEx && sqlEx.Number == 271)
                    {
                        // Error 271 = Cannot modify computed column (InvoiceNumber)
                        // If InvoiceNumber is computed, insert without it, then update via raw SQL
                        sale.InvoiceNumber = string.Empty; // Clear it
                        await _context.SaveChangesAsync(); // Save without InvoiceNumber
                        
                        // Now update InvoiceNumber using raw SQL
                        await _context.Database.ExecuteSqlRawAsync(
                            $"UPDATE Sales SET InvoiceNumber = '{invoiceNumber.Replace("'", "''")}' WHERE SaleID = {sale.SaleID}"
                        );
                    }

                    // Fetch the complete sale with all related data
                    var result = await GetSaleByIdAsync(sale.SaleID);
                    return (true, "Sale created successfully", result);
                }
                catch (Microsoft.EntityFrameworkCore.DbUpdateException ex)
                {
                    // Extract detailed SQL error information
                    string errorMessage = "Failed to create sale: ";
                    
                    if (ex.InnerException is Microsoft.Data.SqlClient.SqlException sqlEx)
                    {
                        // SQL Error 547 = Foreign key constraint violation
                        if (sqlEx.Number == 547)
                        {
                            errorMessage += "Foreign key constraint violation. ";
                            if (!string.IsNullOrEmpty(sqlEx.Message))
                                errorMessage += sqlEx.Message;
                            else
                                errorMessage += "A referenced record does not exist (e.g., invalid PatientID, MedicineID, or SoldBy).";
                        }
                        // SQL Error 515 = Cannot insert NULL into NOT NULL column
                        else if (sqlEx.Number == 515)
                        {
                            errorMessage += "Cannot insert NULL into a required field. ";
                            if (!string.IsNullOrEmpty(sqlEx.Message))
                                errorMessage += sqlEx.Message;
                        }
                        // Other SQL errors
                        else
                        {
                            errorMessage += $"Database error ({sqlEx.Number}): ";
                            if (!string.IsNullOrEmpty(sqlEx.Message))
                                errorMessage += sqlEx.Message;
                            else
                                errorMessage += ex.Message;
                        }
                    }
                    else if (ex.InnerException != null)
                    {
                        errorMessage += ex.InnerException.Message;
                    }
                    else
                    {
                        errorMessage += ex.Message;
                    }
                    
                    Console.WriteLine($"Error creating sale: {errorMessage}");
                    Console.WriteLine($"Stack trace: {ex.StackTrace}");
                    return (false, errorMessage, null);
                }
                catch (Exception ex)
                {
                    string errorMessage = $"Failed to create sale: {ex.Message}";
                    if (ex.InnerException != null)
                    {
                        errorMessage += $" Inner exception: {ex.InnerException.Message}";
                    }
                    Console.WriteLine($"Error creating sale: {errorMessage}");
                    Console.WriteLine($"Stack trace: {ex.StackTrace}");
                    return (false, errorMessage, null);
                }
            });
        }

        public async Task<(bool Success, string Message, SaleDto? Data)> CompleteSaleFromMedicationRequestAsync(int medicationRequestId, int soldBy)
        {
            var strategy = _context.Database.CreateExecutionStrategy();
            
            return await strategy.ExecuteAsync(async () =>
            {
                try
                {
                    // Get medication request with all related data
                    var medicationRequest = await _context.MedicationRequests
                        .Include(mr => mr.Patient)
                            .ThenInclude(p => p.User)
                        .Include(mr => mr.Pharmacist)
                        .Include(mr => mr.RequestItems)
                            .ThenInclude(ri => ri.Medicine)
                        .FirstOrDefaultAsync(mr => mr.MedicationRequestID == medicationRequestId);

                    if (medicationRequest == null)
                    {
                        return (false, "Medication request not found", null);
                    }

                    if (medicationRequest.Status != "Paid")
                    {
                        return (false, $"Medication request must be in 'Paid' status to complete sale. Current status: {medicationRequest.Status}", null);
                    }

                    // Check if sale already exists for this medication request
                    var existingPayment = await _context.Payments
                        .FirstOrDefaultAsync(p => p.MedicationRequestID == medicationRequestId && p.Status == "Completed");
                    
                    if (existingPayment == null)
                    {
                        return (false, "No completed payment found for this medication request", null);
                    }

                    // Validate stock and calculate total
                    decimal totalAmount = 0;
                    var medicines = new List<(Medicine Medicine, int Quantity)>();
                    
                    foreach (var item in medicationRequest.RequestItems)
                    {
                        var medicine = item.Medicine;
                        if (medicine == null)
                        {
                            return (false, $"Medicine with ID {item.MedicineID} not found", null);
                        }

                        if (medicine.StockQuantity < item.RequestedQuantity)
                        {
                            return (false, $"Insufficient stock for {medicine.MedicineName}. Available: {medicine.StockQuantity}, Required: {item.RequestedQuantity}", null);
                        }

                        totalAmount += medicine.Price * item.RequestedQuantity;
                        medicines.Add((medicine, item.RequestedQuantity));
                    }

                    // Generate invoice number
                    var lastSale = await _context.Sales
                        .OrderByDescending(s => s.SaleID)
                        .FirstOrDefaultAsync();
                    
                    var lastNumber = 0;
                    if (lastSale != null && lastSale.InvoiceNumber.StartsWith($"INV-{DateTime.Now.Year}"))
                    {
                        var parts = lastSale.InvoiceNumber.Split('-');
                        if (parts.Length == 3)
                            int.TryParse(parts[2], out lastNumber);
                    }

                    var invoiceNumber = InvoiceGenerator.GenerateInvoiceNumber(lastNumber);

                    // Create sale entity
                    var sale = new Sale
                    {
                        InvoiceNumber = invoiceNumber,
                        PatientID = medicationRequest.PatientID,
                        TotalAmount = totalAmount,
                        PaymentMethod = existingPayment.Method,
                        PaymentStatus = "Paid",
                        SoldBy = soldBy,
                        Notes = $"Sale from Medication Request #{medicationRequest.MedicationRequestID}",
                        SaleDate = DateTime.Now,
                        PaymentReference = existingPayment.TransactionRef,
                        PaymentDate = existingPayment.CompletedDate,
                        MedicationRequestID = medicationRequest.MedicationRequestID
                    };

                    _context.Sales.Add(sale);

                    // Create sale items and update stock
                    foreach (var (medicine, quantity) in medicines)
                    {
                        var saleItem = new SaleItem
                        {
                            Sale = sale,
                            MedicineID = medicine.MedicineID,
                            Quantity = quantity,
                            UnitPrice = medicine.Price,
                            TotalPrice = medicine.Price * quantity
                        };
                        _context.SaleItems.Add(saleItem);

                        // Update stock
                        medicine.StockQuantity -= quantity;
                        medicine.LastUpdated = DateTime.Now;
                    }

                    // Update MedicationRequest status to "Dispensed"
                    medicationRequest.Status = "Dispensed";

                    // Single SaveChangesAsync for all operations
                    try
                    {
                        await _context.SaveChangesAsync();
                    }
                    catch (Microsoft.EntityFrameworkCore.DbUpdateException ex) when (ex.InnerException is Microsoft.Data.SqlClient.SqlException sqlEx && sqlEx.Number == 271)
                    {
                        // Error 271 = Cannot modify computed column (InvoiceNumber)
                        // If InvoiceNumber is computed, update it separately
                        sale.InvoiceNumber = string.Empty; // Clear it
                        await _context.SaveChangesAsync(); // Save without InvoiceNumber
                        
                        // Now update InvoiceNumber using raw SQL
                        await _context.Database.ExecuteSqlRawAsync(
                            $"UPDATE Sales SET InvoiceNumber = '{invoiceNumber.Replace("'", "''")}' WHERE SaleID = {sale.SaleID}"
                        );
                    }

                    // Notifications will be handled by the controller or can be added via dependency injection if needed
                    // For now, we'll skip notifications here to avoid circular dependencies

                    // Fetch the complete sale with all related data
                    var result = await GetSaleByIdAsync(sale.SaleID);
                    return (true, "Sale completed successfully from medication request", result);
                }
                catch (Microsoft.EntityFrameworkCore.DbUpdateException ex)
                {
                    // Extract detailed SQL error information
                    string errorMessage = "Failed to complete sale from medication request: ";
                    
                    if (ex.InnerException is Microsoft.Data.SqlClient.SqlException sqlEx)
                    {
                        // SQL Error 547 = Foreign key constraint violation
                        if (sqlEx.Number == 547)
                        {
                            errorMessage += "Foreign key constraint violation. ";
                            if (!string.IsNullOrEmpty(sqlEx.Message))
                                errorMessage += sqlEx.Message;
                            else
                                errorMessage += "A referenced record does not exist (e.g., invalid PatientID, MedicineID, or SoldBy).";
                        }
                        // SQL Error 515 = Cannot insert NULL into NOT NULL column
                        else if (sqlEx.Number == 515)
                        {
                            errorMessage += "Cannot insert NULL into a required field. ";
                            if (!string.IsNullOrEmpty(sqlEx.Message))
                                errorMessage += sqlEx.Message;
                        }
                        // Other SQL errors
                        else
                        {
                            errorMessage += $"Database error ({sqlEx.Number}): ";
                            if (!string.IsNullOrEmpty(sqlEx.Message))
                                errorMessage += sqlEx.Message;
                            else
                                errorMessage += ex.Message;
                        }
                    }
                    else if (ex.InnerException != null)
                    {
                        errorMessage += ex.InnerException.Message;
                    }
                    else
                    {
                        errorMessage += ex.Message;
                    }
                    
                    Console.WriteLine($"Error completing sale from medication request: {errorMessage}");
                    Console.WriteLine($"Stack trace: {ex.StackTrace}");
                    return (false, errorMessage, null);
                }
                catch (Exception ex)
                {
                    string errorMessage = $"Failed to complete sale from medication request: {ex.Message}";
                    if (ex.InnerException != null)
                    {
                        errorMessage += $" Inner exception: {ex.InnerException.Message}";
                    }
                    Console.WriteLine($"Error completing sale from medication request: {errorMessage}");
                    Console.WriteLine($"Stack trace: {ex.StackTrace}");
                    return (false, errorMessage, null);
                }
            });
        }
    }
}