using Microsoft.EntityFrameworkCore;
using PharmaCareSystem.Api.Data;
using PharmaCareSystem.Api.Models;
using PharmaCareSystem.Api.DTOs.Payments;
using PharmaCareSystem.Api.Helpers;

namespace PharmaCareSystem.Api.Services
{
    public interface IPaymentService
    {
        Task<List<PaymentDto>> GetPatientPaymentsAsync(int patientId);
        Task<List<PaymentDto>> GetPrescriptionPaymentsAsync(int prescriptionId);
        Task<PaymentDto?> GetPaymentByIdAsync(int paymentId);
        Task<(bool Success, string Message, PaymentDto? Data)> CreatePaymentAsync(CreatePaymentDto dto, int patientId);
        Task<(bool Success, string Message)> UpdatePaymentStatusAsync(int paymentId, PaymentStatusDto dto);
    }

    public class PaymentService : IPaymentService
    {
        private readonly PharmaCareDbContext _context;
        private readonly INotificationService _notificationService;

        public PaymentService(PharmaCareDbContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        public async Task<List<PaymentDto>> GetPatientPaymentsAsync(int patientId)
        {
            try
            {
                var payments = await _context.Payments
                    .Include(p => p.Patient)
                        .ThenInclude(pt => pt.User)
                    .Include(p => p.Prescription)
                    .Include(p => p.MedicationRequest)
                    .Where(p => p.PatientID == patientId)
                    .OrderByDescending(p => p.PaymentDate)
                    .Select(p => new PaymentDto
                    {
                        PaymentID = p.PaymentID,
                        PatientID = p.PatientID,
                        PatientName = (p.Patient != null ? p.Patient.FirstName + " " + p.Patient.LastName : "Unknown"),
                        PrescriptionID = p.PrescriptionID,
                        MedicationRequestID = p.MedicationRequestID,
                        Amount = p.Amount,
                        Status = p.Status,
                        Method = p.Method,
                        TransactionRef = p.TransactionRef,
                        PaymentDetails = p.PaymentDetails,
                        PaymentDate = p.PaymentDate,
                        CompletedDate = p.CompletedDate
                    })
                    .ToListAsync();
                
                // Remove duplicates by PaymentID (in case of any data issues)
                return payments
                    .GroupBy(p => p.PaymentID)
                    .Select(g => g.First())
                    .ToList();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetPatientPaymentsAsync: {ex.Message}");
                return new List<PaymentDto>();
            }
        }

        public async Task<List<PaymentDto>> GetPrescriptionPaymentsAsync(int prescriptionId)
        {
            try
            {
                return await _context.Payments
                    .Include(p => p.Patient)
                        .ThenInclude(pt => pt.User)
                    .Include(p => p.Prescription)
                    .Where(p => p.PrescriptionID == prescriptionId)
                    .OrderByDescending(p => p.PaymentDate)
                    .Select(p => new PaymentDto
                    {
                        PaymentID = p.PaymentID,
                        PatientID = p.PatientID,
                        PatientName = (p.Patient != null ? p.Patient.FirstName + " " + p.Patient.LastName : "Unknown"),
                        PrescriptionID = p.PrescriptionID,
                        MedicationRequestID = p.MedicationRequestID,
                        Amount = p.Amount,
                        Status = p.Status,
                        Method = p.Method,
                        TransactionRef = p.TransactionRef,
                        PaymentDetails = p.PaymentDetails,
                        PaymentDate = p.PaymentDate,
                        CompletedDate = p.CompletedDate
                    })
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetPrescriptionPaymentsAsync: {ex.Message}");
                return new List<PaymentDto>();
            }
        }

        public async Task<PaymentDto?> GetPaymentByIdAsync(int paymentId)
        {
            try
            {
                return await _context.Payments
                    .Include(p => p.Patient)
                        .ThenInclude(pt => pt.User)
                    .Include(p => p.Prescription)
                    .Include(p => p.MedicationRequest)
                    .Where(p => p.PaymentID == paymentId)
                    .Select(p => new PaymentDto
                    {
                        PaymentID = p.PaymentID,
                        PatientID = p.PatientID,
                        PatientName = (p.Patient != null ? p.Patient.FirstName + " " + p.Patient.LastName : "Unknown"),
                        PrescriptionID = p.PrescriptionID,
                        MedicationRequestID = p.MedicationRequestID,
                        Amount = p.Amount,
                        Status = p.Status,
                        Method = p.Method,
                        TransactionRef = p.TransactionRef,
                        PaymentDetails = p.PaymentDetails,
                        PaymentDate = p.PaymentDate,
                        CompletedDate = p.CompletedDate
                    })
                    .FirstOrDefaultAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetPaymentByIdAsync: {ex.Message}");
                return null;
            }
        }

        public async Task<(bool Success, string Message, PaymentDto? Data)> CreatePaymentAsync(CreatePaymentDto dto, int patientId)
        {
            try
            {
                // Validate that either PrescriptionID or MedicationRequestID is provided
                if (!dto.PrescriptionID.HasValue && !dto.MedicationRequestID.HasValue)
                {
                    return (false, "Either PrescriptionID or MedicationRequestID must be provided.", null);
                }

                if (dto.PrescriptionID.HasValue && dto.MedicationRequestID.HasValue)
                {
                    return (false, "Cannot provide both PrescriptionID and MedicationRequestID. Please provide only one.", null);
                }

                decimal totalAmount = 0;
                int? prescriptionId = null;
                int? medicationRequestId = null;

                // Handle Prescription payment
                if (dto.PrescriptionID.HasValue)
                {
                    var prescription = await _context.Prescriptions
                        .Include(p => p.PrescriptionItems)
                            .ThenInclude(pi => pi.Medicine)
                        .FirstOrDefaultAsync(p => p.PrescriptionID == dto.PrescriptionID && p.PatientID == patientId);

                    if (prescription == null)
                    {
                        return (false, "Prescription not found or does not belong to you.", null);
                    }

                    // Check if already paid
                    var existingPayment = await _context.Payments
                        .FirstOrDefaultAsync(p => p.PrescriptionID == dto.PrescriptionID && p.Status == "Completed");

                    if (existingPayment != null)
                    {
                        return (false, "This prescription has already been paid.", null);
                    }

                    // Calculate total amount from prescription items
                    totalAmount = prescription.PrescriptionItems.Sum(pi => pi.Quantity * pi.Medicine.Price);
                    prescriptionId = dto.PrescriptionID;
                }
                // Handle MedicationRequest payment
                else if (dto.MedicationRequestID.HasValue)
                {
                    var medicationRequest = await _context.MedicationRequests
                        .Include(mr => mr.RequestItems)
                            .ThenInclude(ri => ri.Medicine)
                        .FirstOrDefaultAsync(mr => mr.MedicationRequestID == dto.MedicationRequestID.Value && mr.PatientID == patientId);

                    if (medicationRequest == null)
                    {
                        return (false, "Medication request not found or does not belong to you.", null);
                    }

                    if (medicationRequest.Status != "Approved")
                    {
                        return (false, "Only approved medication requests can be paid.", null);
                    }

                    // Check if already paid - check for completed payments
                    var existingCompletedPayment = await _context.Payments
                        .FirstOrDefaultAsync(p => p.MedicationRequestID == dto.MedicationRequestID && p.Status == "Completed");

                    if (existingCompletedPayment != null)
                    {
                        return (false, "This medication request has already been paid.", null);
                    }
                    
                    // Also check for pending payments to prevent duplicates
                    var existingPendingPayment = await _context.Payments
                        .FirstOrDefaultAsync(p => p.MedicationRequestID == dto.MedicationRequestID && p.Status == "Pending");

                    if (existingPendingPayment != null)
                    {
                        return (false, "A pending payment already exists for this medication request. Please complete or cancel the existing payment first.", null);
                    }

                    // Calculate total amount from request items
                    totalAmount = medicationRequest.RequestItems.Sum(ri => ri.RequestedQuantity * ri.Medicine.Price);
                    medicationRequestId = dto.MedicationRequestID;
                }

                // Determine initial status - auto-complete if Cash or has transaction reference
                string initialStatus = "Pending";
                DateTime? completedDate = null;
                
                // Auto-complete if Cash payment OR if transaction reference is provided
                if (dto.Method == "Cash" || !string.IsNullOrWhiteSpace(dto.TransactionRef))
                {
                    initialStatus = "Completed";
                    completedDate = DateTime.Now;
                    Console.WriteLine($"Payment will be created as Completed. Method: {dto.Method}, HasTransactionRef: {!string.IsNullOrWhiteSpace(dto.TransactionRef)}");
                }
                else
                {
                    Console.WriteLine($"Payment will be created as Pending. Method: {dto.Method}, TransactionRef: {dto.TransactionRef ?? "null"}");
                }

                // Create payment
                var payment = new Payment
                {
                    PatientID = patientId,
                    PrescriptionID = prescriptionId, // Can be null for medication request payments
                    MedicationRequestID = medicationRequestId, // Can be null for prescription payments
                    Amount = totalAmount,
                    Status = initialStatus, // Set to Completed if Cash or has transaction ref
                    Method = dto.Method,
                    TransactionRef = dto.TransactionRef ?? (dto.Method == "Cash" ? $"CASH-{DateTime.Now:yyyyMMddHHmmss}" : null),
                    PaymentDetails = dto.PaymentDetails,
                    PaymentDate = DateTime.Now,
                    CompletedDate = completedDate
                };

                _context.Payments.Add(payment);
                
                try
                {
                    await _context.SaveChangesAsync();
                    Console.WriteLine($"Payment {payment.PaymentID} saved with status: {payment.Status}");
                    
                    // If payment is completed, update related entities
                    if (initialStatus == "Completed")
                    {
                        // Update medication request status to "Paid" if applicable
                        if (medicationRequestId.HasValue)
                        {
                            var medicationRequest = await _context.MedicationRequests
                                .FirstOrDefaultAsync(mr => mr.MedicationRequestID == medicationRequestId.Value);
                            
                            if (medicationRequest != null && medicationRequest.Status == "Approved")
                            {
                                medicationRequest.Status = "Paid";
                                await _context.SaveChangesAsync();
                                Console.WriteLine($"Medication Request {medicationRequestId.Value} status updated to Paid");
                            }
                        }
                        // Update prescription status to "Paid" if applicable
                        else if (prescriptionId.HasValue)
                        {
                            var prescription = await _context.Prescriptions
                                .FirstOrDefaultAsync(p => p.PrescriptionID == prescriptionId.Value);
                            
                            if (prescription != null && prescription.Status != "Dispensed" && prescription.Status != "Completed")
                            {
                                prescription.Status = "Paid";
                                await _context.SaveChangesAsync();
                                Console.WriteLine($"Prescription {prescriptionId.Value} status updated to Paid");
                            }
                        }
                    }
                }
                catch (Microsoft.EntityFrameworkCore.DbUpdateException ex)
                {
                    // Extract detailed SQL error information
                    string errorMessage = "Failed to save payment: ";
                    
                    if (ex.InnerException is Microsoft.Data.SqlClient.SqlException sqlEx)
                    {
                        // SQL Error 547 = Foreign key constraint violation
                        if (sqlEx.Number == 547)
                        {
                            errorMessage += "Foreign key constraint violation. ";
                            if (!string.IsNullOrEmpty(sqlEx.Message))
                                errorMessage += sqlEx.Message;
                            else
                                errorMessage += "A referenced record does not exist (e.g., invalid PatientID, PrescriptionID, or MedicationRequestID).";
                        }
                        // SQL Error 515 = Cannot insert NULL into NOT NULL column
                        else if (sqlEx.Number == 515)
                        {
                            errorMessage += "Cannot insert NULL into a required field. ";
                            if (!string.IsNullOrEmpty(sqlEx.Message))
                                errorMessage += sqlEx.Message;
                            else
                                errorMessage += "PrescriptionID column may not be nullable. Please run the SQL migration script to fix this.";
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
                    
                    Console.WriteLine($"Error saving payment: {errorMessage}");
                    Console.WriteLine($"Stack trace: {ex.StackTrace}");
                    return (false, errorMessage, null);
                }
                catch (Exception ex)
                {
                    string errorMessage = $"Failed to save payment: {ex.Message}";
                    if (ex.InnerException != null)
                    {
                        errorMessage += $" Inner exception: {ex.InnerException.Message}";
                    }
                    Console.WriteLine($"Error saving payment: {errorMessage}");
                    Console.WriteLine($"Stack trace: {ex.StackTrace}");
                    return (false, errorMessage, null);
                }

                // Reload payment from database to ensure we have the latest status
                var result = await GetPaymentByIdAsync(payment.PaymentID);
                Console.WriteLine($"Retrieved payment {payment.PaymentID} with status: {result?.Status}");
                return (true, initialStatus == "Completed" ? "Payment created and completed successfully" : "Payment request created successfully", result);
            }
            catch (Exception ex)
            {
                return (false, $"Failed to create payment: {ex.Message}", null);
            }
        }

        public async Task<(bool Success, string Message)> UpdatePaymentStatusAsync(int paymentId, PaymentStatusDto dto)
        {
            var strategy = _context.Database.CreateExecutionStrategy();
            
            return await strategy.ExecuteAsync(async () =>
            {
                try
                {
                    var payment = await _context.Payments
                        .Include(p => p.Prescription)
                        .Include(p => p.MedicationRequest)
                        .FirstOrDefaultAsync(p => p.PaymentID == paymentId);
                    
                if (payment == null)
                {
                    return (false, "Payment not found.");
                }

                var oldStatus = payment.Status;
                payment.Status = dto.Status;
                if (!string.IsNullOrWhiteSpace(dto.TransactionRef))
                {
                    payment.TransactionRef = dto.TransactionRef;
                }

                if (dto.Status == "Completed")
                {
                    payment.CompletedDate = DateTime.Now;
                    
                    // Save payment status first
                    await _context.SaveChangesAsync();

                    // Handle Prescription Payment (existing flow - creates Sale immediately)
                    if (payment.PrescriptionID.HasValue)
                    {
                        var prescription = await _context.Prescriptions
                            .Include(p => p.Patient)
                                .ThenInclude(pat => pat.User)
                            .Include(p => p.CreatedByUser)
                            .Include(p => p.PrescriptionItems)
                                .ThenInclude(pi => pi.Medicine)
                            .FirstOrDefaultAsync(p => p.PrescriptionID == payment.PrescriptionID);
                        
                        if (prescription == null)
                        {
                            return (false, "Prescription not found.");
                        }

                    // Check if Sale already exists for this payment
                    var existingSale = await _context.Sales
                        .FirstOrDefaultAsync(s => s.PaymentReference == payment.TransactionRef && s.PatientID == payment.PatientID);
                    
                    if (existingSale == null)
                    {
                        // Step 1: Create Sale record
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

                        var sale = new Sale
                        {
                            InvoiceNumber = invoiceNumber,
                            PatientID = payment.PatientID,
                            TotalAmount = payment.Amount,
                            PaymentMethod = payment.Method,
                            PaymentStatus = "Paid",
                            SoldBy = prescription.CreatedBy, // Pharmacist who created the prescription
                            SaleDate = DateTime.Now,
                            PaymentReference = payment.TransactionRef,
                            PaymentDate = payment.CompletedDate,
                            Notes = $"Payment for Prescription #{prescription.PrescriptionID}"
                        };

                        _context.Sales.Add(sale);
                        await _context.SaveChangesAsync(); // Save to get SaleID

                        // Step 2: Create SaleItems from PrescriptionItems
                        foreach (var prescriptionItem in prescription.PrescriptionItems)
                        {
                            var medicine = prescriptionItem.Medicine;
                            
                            // Check stock availability
                            if (medicine.StockQuantity < prescriptionItem.Quantity)
                            {
                                return (false, $"Insufficient stock for {medicine.MedicineName}. Available: {medicine.StockQuantity}, Required: {prescriptionItem.Quantity}");
                            }

                            var saleItem = new SaleItem
                            {
                                Sale = sale,
                                MedicineID = prescriptionItem.MedicineID,
                                Quantity = prescriptionItem.Quantity,
                                UnitPrice = medicine.Price,
                                TotalPrice = medicine.Price * prescriptionItem.Quantity
                            };

                            _context.SaleItems.Add(saleItem);

                            // Step 4: Reduce medicine stock
                            medicine.StockQuantity -= prescriptionItem.Quantity;
                            medicine.LastUpdated = DateTime.Now;
                        }

                        await _context.SaveChangesAsync();
                    }

                    // Step 3: Update prescription status
                    if (prescription.Status != "Dispensed" && prescription.Status != "Completed")
                    {
                        prescription.Status = "Paid";
                    }

                    await _context.SaveChangesAsync();

                    // Step 5: Create notifications
                    // Notify patient
                    if (prescription.Patient?.User != null)
                    {
                        await _notificationService.CreateNotificationAsync(
                            prescription.Patient.User.UserID,
                            "Payment Successful",
                            $"Your payment for prescription #{prescription.PrescriptionID} has been received. Order is being prepared.",
                            "Success",
                            "Payment",
                            payment.PaymentID
                        );
                    }

                    // Notify pharmacist
                    if (prescription.CreatedByUser != null)
                    {
                        await _notificationService.CreateNotificationAsync(
                            prescription.CreatedByUser.UserID,
                            "New Paid Order",
                            $"Patient {prescription.Patient?.FirstName} {prescription.Patient?.LastName} has completed payment for prescription #{prescription.PrescriptionID}. Please prepare the medication.",
                            "Info",
                            "Payment",
                            payment.PaymentID
                        );
                    }

                        return (true, "Payment completed successfully. Sale created and stock updated.");
                    }
                    // Handle MedicationRequest Payment (new flow - sets status to Paid, Sale created later in POS)
                    else if (payment.MedicationRequestID.HasValue)
                    {
                        var medicationRequest = await _context.MedicationRequests
                            .Include(mr => mr.Patient)
                                .ThenInclude(p => p.User)
                            .Include(mr => mr.Pharmacist)
                            .FirstOrDefaultAsync(mr => mr.MedicationRequestID == payment.MedicationRequestID);

                        if (medicationRequest == null)
                        {
                            return (false, "Medication request not found.");
                        }

                        // Update MedicationRequest status to "Paid"
                        medicationRequest.Status = "Paid";
                        await _context.SaveChangesAsync();

                        // Notify patient
                        if (medicationRequest.Patient?.User != null)
                        {
                            await _notificationService.CreateNotificationAsync(
                                medicationRequest.Patient.User.UserID,
                                "Payment Successful",
                                $"Your payment for medication request #{medicationRequest.MedicationRequestID} has been received. Your order is ready for pickup.",
                                "Success",
                                "Payment",
                                payment.PaymentID
                            );
                        }

                        // Notify pharmacist
                        if (medicationRequest.Pharmacist != null)
                        {
                            await _notificationService.CreateNotificationAsync(
                                medicationRequest.Pharmacist.UserID,
                                "Payment Received - Ready for Dispense",
                                $"Patient {medicationRequest.Patient?.FirstName} {medicationRequest.Patient?.LastName} has completed payment for Medication Request #{medicationRequest.MedicationRequestID}. Please complete the sale in POS.",
                                "Info",
                                "MedicationRequest",
                                medicationRequest.MedicationRequestID
                            );
                        }

                        return (true, "Payment completed successfully. Medication request is now ready for dispense.");
                    }
                    else
                    {
                        return (false, "Payment must be linked to either a Prescription or MedicationRequest.");
                    }
                }
                else if (dto.Status == "Failed")
                {
                    await _context.SaveChangesAsync();
                    return (true, "Payment status updated to Failed.");
                }
                else
                {
                    await _context.SaveChangesAsync();
                    return (true, "Payment status updated successfully");
                }
                }
                catch (Microsoft.EntityFrameworkCore.DbUpdateException ex)
                {
                    // Extract detailed SQL error information
                    string errorMessage = "Failed to update payment status: ";
                    
                    if (ex.InnerException is Microsoft.Data.SqlClient.SqlException sqlEx)
                    {
                        // SQL Error 547 = Foreign key constraint violation
                        if (sqlEx.Number == 547)
                        {
                            errorMessage += "Foreign key constraint violation. ";
                            if (!string.IsNullOrEmpty(sqlEx.Message))
                                errorMessage += sqlEx.Message;
                            else
                                errorMessage += "A referenced record does not exist.";
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
                    
                    Console.WriteLine($"Error in UpdatePaymentStatusAsync: {errorMessage}");
                    Console.WriteLine($"Stack Trace: {ex.StackTrace}");
                    return (false, errorMessage);
                }
                catch (Exception ex)
                {
                    string errorMessage = $"Failed to update payment status: {ex.Message}";
                    if (ex.InnerException != null)
                    {
                        errorMessage += $" Inner exception: {ex.InnerException.Message}";
                    }
                    Console.WriteLine($"Error in UpdatePaymentStatusAsync: {errorMessage}");
                    Console.WriteLine($"Stack Trace: {ex.StackTrace}");
                    return (false, errorMessage);
                }
            });
        }
    }
}

