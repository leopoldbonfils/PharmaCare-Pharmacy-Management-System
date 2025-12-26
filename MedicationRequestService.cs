using Microsoft.EntityFrameworkCore;
using PharmaCareSystem.Api.Data;
using PharmaCareSystem.Api.Models;
using PharmaCareSystem.Api.DTOs.MedicationRequests;
using PharmaCareSystem.Api.DTOs.Prescriptions;

namespace PharmaCareSystem.Api.Services
{
    public interface IMedicationRequestService
    {
        Task<List<MedicationRequestDto>> GetAllRequestsAsync(int? pharmacistId = null);
        Task<List<MedicationRequestDto>> GetPatientRequestsAsync(int patientId);
        Task<MedicationRequestDto?> GetRequestByIdAsync(int requestId);
        Task<(bool Success, string Message, MedicationRequestDto? Data)> CreateRequestAsync(CreateMedicationRequestDto dto);
        Task<(bool Success, string Message)> UpdateRequestStatusAsync(int requestId, UpdateMedicationRequestStatusDto dto, int pharmacistId);
        Task<(bool Success, string Message)> CancelRequestAsync(int requestId, int patientId);
        Task<List<MedicationRequestDto>> GetPaidRequestsAwaitingDispenseAsync(int? pharmacistId = null);
    }

    public class MedicationRequestService : IMedicationRequestService
    {
        private readonly PharmaCareDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly IPrescriptionService _prescriptionService;

        public MedicationRequestService(
            PharmaCareDbContext context,
            INotificationService notificationService,
            IPrescriptionService prescriptionService)
        {
            _context = context;
            _notificationService = notificationService;
            _prescriptionService = prescriptionService;
        }

        public async Task<List<MedicationRequestDto>> GetAllRequestsAsync(int? pharmacistId = null)
        {
            var query = _context.MedicationRequests
                .Include(mr => mr.Patient)
                    .ThenInclude(p => p.User)
                .Include(mr => mr.Pharmacist)
                .Include(mr => mr.ReviewedByUser)
                .Include(mr => mr.RequestItems)
                    .ThenInclude(ri => ri.Medicine)
                .AsQueryable();

            if (pharmacistId.HasValue)
            {
                query = query.Where(mr => mr.PharmacistID == pharmacistId.Value);
            }

            return await query
                .OrderByDescending(mr => mr.RequestDate)
                .Select(mr => new MedicationRequestDto
                {
                    MedicationRequestID = mr.MedicationRequestID,
                    PatientID = mr.PatientID,
                    PatientName = mr.Patient.FirstName + " " + mr.Patient.LastName,
                    PharmacistID = mr.PharmacistID,
                    PharmacistName = mr.Pharmacist.FirstName + " " + mr.Pharmacist.LastName,
                    PharmacyName = mr.Pharmacist.FirstName + " " + mr.Pharmacist.LastName + " Pharmacy", // Default, can be extended
                    Symptoms = mr.Symptoms,
                    ImageUrl = mr.ImageUrl,
                    Notes = mr.Notes,
                    PharmacistNotes = mr.PharmacistNotes,
                    Status = mr.Status,
                    PrescriptionID = mr.PrescriptionID,
                    RequestDate = mr.RequestDate,
                    ReviewedDate = mr.ReviewedDate,
                    ReviewedBy = mr.ReviewedBy,
                    ReviewedByName = mr.ReviewedByUser != null ? mr.ReviewedByUser.FirstName + " " + mr.ReviewedByUser.LastName : null,
                    TotalAmount = mr.RequestItems.Sum(ri => ri.RequestedQuantity * ri.Medicine.Price),
                    RequestItems = mr.RequestItems.Select(ri => new MedicationRequestItemDto
                    {
                        RequestItemID = ri.RequestItemID,
                        MedicineID = ri.MedicineID,
                        MedicineName = ri.Medicine.MedicineName,
                        GenericName = ri.Medicine.GenericName,
                        RequestedQuantity = ri.RequestedQuantity,
                        AvailableStock = ri.Medicine.StockQuantity,
                        UnitPrice = ri.Medicine.Price,
                        Notes = ri.Notes
                    }).ToList()
                })
                .ToListAsync();
        }

        public async Task<List<MedicationRequestDto>> GetPatientRequestsAsync(int patientId)
        {
            return await _context.MedicationRequests
                .Include(mr => mr.Patient)
                .Include(mr => mr.Pharmacist)
                .Include(mr => mr.ReviewedByUser)
                .Include(mr => mr.RequestItems)
                    .ThenInclude(ri => ri.Medicine)
                .Where(mr => mr.PatientID == patientId)
                .OrderByDescending(mr => mr.RequestDate)
                .Select(mr => new MedicationRequestDto
                {
                    MedicationRequestID = mr.MedicationRequestID,
                    PatientID = mr.PatientID,
                    PatientName = mr.Patient.FirstName + " " + mr.Patient.LastName,
                    PharmacistID = mr.PharmacistID,
                    PharmacistName = mr.Pharmacist.FirstName + " " + mr.Pharmacist.LastName,
                    PharmacyName = mr.Pharmacist.FirstName + " " + mr.Pharmacist.LastName + " Pharmacy",
                    Symptoms = mr.Symptoms,
                    ImageUrl = mr.ImageUrl,
                    Notes = mr.Notes,
                    PharmacistNotes = mr.PharmacistNotes,
                    Status = mr.Status,
                    PrescriptionID = mr.PrescriptionID,
                    RequestDate = mr.RequestDate,
                    ReviewedDate = mr.ReviewedDate,
                    ReviewedBy = mr.ReviewedBy,
                    ReviewedByName = mr.ReviewedByUser != null ? mr.ReviewedByUser.FirstName + " " + mr.ReviewedByUser.LastName : null,
                    RequestItems = mr.RequestItems.Select(ri => new MedicationRequestItemDto
                    {
                        RequestItemID = ri.RequestItemID,
                        MedicineID = ri.MedicineID,
                        MedicineName = ri.Medicine.MedicineName,
                        GenericName = ri.Medicine.GenericName,
                        RequestedQuantity = ri.RequestedQuantity,
                        AvailableStock = ri.Medicine.StockQuantity,
                        UnitPrice = ri.Medicine.Price,
                        Notes = ri.Notes
                    }).ToList()
                })
                .ToListAsync();
        }

        public async Task<MedicationRequestDto?> GetRequestByIdAsync(int requestId)
        {
            return await _context.MedicationRequests
                .Include(mr => mr.Patient)
                    .ThenInclude(p => p.User)
                .Include(mr => mr.Pharmacist)
                .Include(mr => mr.ReviewedByUser)
                .Include(mr => mr.RequestItems)
                    .ThenInclude(ri => ri.Medicine)
                .Where(mr => mr.MedicationRequestID == requestId)
                .Select(mr => new MedicationRequestDto
                {
                    MedicationRequestID = mr.MedicationRequestID,
                    PatientID = mr.PatientID,
                    PatientName = mr.Patient.FirstName + " " + mr.Patient.LastName,
                    PharmacistID = mr.PharmacistID,
                    PharmacistName = mr.Pharmacist.FirstName + " " + mr.Pharmacist.LastName,
                    PharmacyName = mr.Pharmacist.FirstName + " " + mr.Pharmacist.LastName + " Pharmacy",
                    Symptoms = mr.Symptoms,
                    ImageUrl = mr.ImageUrl,
                    Notes = mr.Notes,
                    PharmacistNotes = mr.PharmacistNotes,
                    Status = mr.Status,
                    PrescriptionID = mr.PrescriptionID,
                    RequestDate = mr.RequestDate,
                    ReviewedDate = mr.ReviewedDate,
                    ReviewedBy = mr.ReviewedBy,
                    ReviewedByName = mr.ReviewedByUser != null ? mr.ReviewedByUser.FirstName + " " + mr.ReviewedByUser.LastName : null,
                    TotalAmount = mr.RequestItems.Sum(ri => ri.RequestedQuantity * ri.Medicine.Price),
                    RequestItems = mr.RequestItems.Select(ri => new MedicationRequestItemDto
                    {
                        RequestItemID = ri.RequestItemID,
                        MedicineID = ri.MedicineID,
                        MedicineName = ri.Medicine.MedicineName,
                        GenericName = ri.Medicine.GenericName,
                        RequestedQuantity = ri.RequestedQuantity,
                        AvailableStock = ri.Medicine.StockQuantity,
                        UnitPrice = ri.Medicine.Price,
                        Notes = ri.Notes
                    }).ToList()
                })
                .FirstOrDefaultAsync();
        }

        /// <summary>
        /// Creates a new medication request. Uses execution strategy for transaction handling
        /// to support retry policies in EF Core.
        /// </summary>
        public async Task<(bool Success, string Message, MedicationRequestDto? Data)> CreateRequestAsync(CreateMedicationRequestDto dto)
        {
            try
            {
                // Validate input first (before transaction)
                if (dto == null)
                {
                    return (false, "Request data is required.", null);
                }

                if (dto.RequestItems == null || dto.RequestItems.Count == 0)
                {
                    return (false, "Request must contain at least one medicine.", null);
                }

                if (string.IsNullOrWhiteSpace(dto.Symptoms))
                {
                    return (false, "Symptoms are required.", null);
                }

                // Validate patient exists (before transaction)
                var patient = await _context.Patients.FirstOrDefaultAsync(p => p.PatientID == dto.PatientID && p.IsActive);
                if (patient == null)
                {
                    return (false, "Patient not found or inactive.", null);
                }

                // Validate pharmacist exists and is a pharmacist (case-insensitive, before transaction)
                var pharmacist = await _context.Users.FirstOrDefaultAsync(u => 
                    u.UserID == dto.PharmacistID && 
                    u.Role != null &&
                    u.Role.ToLower() == "pharmacist" && 
                    u.IsActive);
                if (pharmacist == null)
                {
                    return (false, "Pharmacist not found or inactive.", null);
                }

                // Validate medicines exist and are in stock (before transaction)
                foreach (var item in dto.RequestItems)
                {
                    var medicine = await _context.Medicines.FindAsync(item.MedicineID);
                    if (medicine == null || !medicine.IsActive)
                    {
                        return (false, $"Medicine with ID {item.MedicineID} not found or inactive.", null);
                    }

                    if (medicine.StockQuantity < item.RequestedQuantity)
                    {
                        return (false, $"{medicine.MedicineName} is out of stock. Available: {medicine.StockQuantity}, Requested: {item.RequestedQuantity}", null);
                    }
                }

                // Use execution strategy to handle transactions with retry policies
                var strategy = _context.Database.CreateExecutionStrategy();
                
                return await strategy.ExecuteAsync(async () =>
                {
                    using var transaction = await _context.Database.BeginTransactionAsync();
                    try
                    {
                        // Create medication request
                        var request = new MedicationRequest
                        {
                            PatientID = dto.PatientID,
                            PharmacistID = dto.PharmacistID,
                            Symptoms = dto.Symptoms.Trim(),
                            ImageUrl = string.IsNullOrWhiteSpace(dto.ImageUrl) ? null : dto.ImageUrl.Trim(),
                            Notes = string.IsNullOrWhiteSpace(dto.Notes) ? null : dto.Notes.Trim(),
                            Status = "Pending",
                            RequestDate = DateTime.Now
                        };

                        _context.MedicationRequests.Add(request);
                        await _context.SaveChangesAsync();

                        // Add request items
                        foreach (var item in dto.RequestItems)
                        {
                            var requestItem = new MedicationRequestItem
                            {
                                MedicationRequestID = request.MedicationRequestID,
                                MedicineID = item.MedicineID,
                                RequestedQuantity = item.RequestedQuantity,
                                Notes = string.IsNullOrWhiteSpace(item.Notes) ? null : item.Notes.Trim()
                            };
                            _context.MedicationRequestItems.Add(requestItem);
                        }

                        await _context.SaveChangesAsync();
                        await transaction.CommitAsync();

                        // Notify pharmacist (outside transaction)
                        var pharmacistUser = await _context.Users.FindAsync(dto.PharmacistID);
                        if (pharmacistUser != null)
                        {
                            try
                            {
                                await _notificationService.CreateNotificationAsync(
                                    dto.PharmacistID,
                                    "New Medication Request",
                                    $"Patient {patient.FirstName} {patient.LastName} has submitted a new medication request.",
                                    "Info",
                                    "MedicationRequest",
                                    request.MedicationRequestID
                                );
                            }
                            catch (Exception notifEx)
                            {
                                // Log but don't fail the request if notification fails
                                Console.WriteLine($"Failed to notify pharmacist: {notifEx.Message}");
                            }
                        }

                        // Notify patient (outside transaction)
                        var patientUser = await _context.Patients
                            .Include(p => p.User)
                            .FirstOrDefaultAsync(p => p.PatientID == dto.PatientID);
                        if (patientUser?.User != null)
                        {
                            try
                            {
                                await _notificationService.CreateNotificationAsync(
                                    patientUser.User.UserID,
                                    "Request Submitted",
                                    "Your medication request has been submitted successfully and is pending review.",
                                    "Success",
                                    "MedicationRequest",
                                    request.MedicationRequestID
                                );
                            }
                            catch (Exception notifEx)
                            {
                                // Log but don't fail the request if notification fails
                                Console.WriteLine($"Failed to notify patient: {notifEx.Message}");
                            }
                        }

                        var result = await GetRequestByIdAsync(request.MedicationRequestID);
                        return (true, "Medication request created successfully", result);
                    }
                    catch (Microsoft.EntityFrameworkCore.DbUpdateException dbEx)
                    {
                        await transaction.RollbackAsync();
                        var innerMessage = dbEx.InnerException?.Message ?? dbEx.Message;
                        return (false, $"Database error: {innerMessage}", null);
                    }
                    catch (Exception ex)
                    {
                        await transaction.RollbackAsync();
                        return (false, $"Failed to create medication request: {ex.Message}", null);
                    }
                });
            }
            catch (Exception ex)
            {
                return (false, $"Failed to create medication request: {ex.Message}", null);
            }
        }

        /// <summary>
        /// Updates the status of a medication request. Uses execution strategy for transaction handling.
        /// </summary>
        public async Task<(bool Success, string Message)> UpdateRequestStatusAsync(int requestId, UpdateMedicationRequestStatusDto dto, int pharmacistId)
        {
            // Use execution strategy to handle transactions with retry policies
            var strategy = _context.Database.CreateExecutionStrategy();
            
            return await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                var request = await _context.MedicationRequests
                    .Include(mr => mr.RequestItems)
                    .Include(mr => mr.Patient)
                        .ThenInclude(p => p.User)
                    .FirstOrDefaultAsync(mr => mr.MedicationRequestID == requestId);

                if (request == null)
                {
                    return (false, "Medication request not found.");
                }

                if (request.PharmacistID != pharmacistId)
                {
                    return (false, "You can only update requests assigned to you.");
                }

                if (request.Status == "Cancelled")
                {
                    return (false, "Cannot update a cancelled request.");
                }

                var oldStatus = request.Status;
                request.Status = dto.Status;
                request.PharmacistNotes = dto.PharmacistNotes;
                request.ReviewedDate = DateTime.Now;
                request.ReviewedBy = pharmacistId;

                // Update item quantities if modified
                if (dto.ModifiedItems != null && dto.ModifiedItems.Count > 0)
                {
                    foreach (var modifiedItem in dto.ModifiedItems)
                    {
                        var requestItem = request.RequestItems.FirstOrDefault(ri => ri.RequestItemID == modifiedItem.RequestItemID);
                        if (requestItem != null)
                        {
                            // Validate quantity doesn't exceed stock
                            var medicine = await _context.Medicines.FindAsync(requestItem.MedicineID);
                            if (medicine != null && modifiedItem.ApprovedQuantity > medicine.StockQuantity)
                            {
                                await transaction.RollbackAsync();
                                return (false, $"{medicine.MedicineName} - Approved quantity ({modifiedItem.ApprovedQuantity}) exceeds available stock ({medicine.StockQuantity})");
                            }
                            
                            requestItem.RequestedQuantity = modifiedItem.ApprovedQuantity;
                        }
                    }
                }

                // Auto-create prescription if approved
                if (dto.Status == "Approved" && request.PrescriptionID == null)
                {
                    var prescriptionDto = new CreatePrescriptionDto
                    {
                        PatientID = request.PatientID,
                        DoctorName = "Pharmacist Review",
                        DoctorContact = "",
                        HospitalName = "Pharmacy",
                        Diagnosis = request.Symptoms,
                        Instructions = request.PharmacistNotes ?? "As per medication request",
                        PrescriptionImageUrl = request.ImageUrl,
                        Items = request.RequestItems.Select(ri => new CreatePrescriptionItemDto
                        {
                            MedicineID = ri.MedicineID,
                            Dosage = "As directed",
                            Frequency = "As needed",
                            Duration = "1 week",
                            Quantity = ri.RequestedQuantity,
                            Instructions = ri.Notes
                        }).ToList()
                    };

                    var (prescriptionSuccess, prescriptionMessage, prescriptionData) = 
                        await _prescriptionService.CreatePrescriptionAsync(prescriptionDto, pharmacistId);

                    if (prescriptionSuccess && prescriptionData != null)
                    {
                        request.PrescriptionID = prescriptionData.PrescriptionID;
                    }
                    else
                    {
                        await transaction.RollbackAsync();
                        return (false, $"Failed to create prescription: {prescriptionMessage}");
                    }
                }
                else if (dto.PrescriptionID.HasValue)
                {
                    request.PrescriptionID = dto.PrescriptionID;
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Notify patient
                if (request.Patient?.User != null)
                {
                    string notificationTitle = "";
                    string notificationMessage = "";
                    string notificationType = "";

                    if (dto.Status == "Approved")
                    {
                        notificationTitle = "Request Approved";
                        notificationMessage = "Your medication request has been approved. A prescription has been created.";
                        notificationType = "Success";
                    }
                    else if (dto.Status == "Rejected")
                    {
                        notificationTitle = "Request Rejected";
                        notificationMessage = $"Your medication request has been rejected. {(!string.IsNullOrEmpty(dto.PharmacistNotes) ? "Reason: " + dto.PharmacistNotes : "")}";
                        notificationType = "Error";
                    }
                    else if (dto.Status == "Reviewed")
                    {
                        notificationTitle = "Request Modified";
                        notificationMessage = "Your medication request has been reviewed and modified by the pharmacist.";
                        notificationType = "Warning";
                    }

                    if (!string.IsNullOrEmpty(notificationTitle))
                    {
                        await _notificationService.CreateNotificationAsync(
                            request.Patient.User.UserID,
                            notificationTitle,
                            notificationMessage,
                            notificationType,
                            "MedicationRequest",
                            requestId
                        );
                    }
                }

                    return (true, "Request status updated successfully");
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    return (false, $"Failed to update request status: {ex.Message}");
                }
            });
        }

        public async Task<(bool Success, string Message)> CancelRequestAsync(int requestId, int patientId)
        {
            try
            {
                var request = await _context.MedicationRequests.FindAsync(requestId);

                if (request == null)
                {
                    return (false, "Medication request not found.");
                }

                if (request.PatientID != patientId)
                {
                    return (false, "You can only cancel your own requests.");
                }

                if (request.Status != "Pending")
                {
                    return (false, "You can only cancel pending requests.");
                }

                request.Status = "Cancelled";
                await _context.SaveChangesAsync();
                return (true, "Request cancelled successfully");
            }
            catch (Exception ex)
            {
                return (false, $"Failed to cancel request: {ex.Message}");
            }
        }

        public async Task<List<MedicationRequestDto>> GetPaidRequestsAwaitingDispenseAsync(int? pharmacistId = null)
        {
            var query = _context.MedicationRequests
                .Include(mr => mr.Patient)
                    .ThenInclude(p => p.User)
                .Include(mr => mr.Pharmacist)
                .Include(mr => mr.ReviewedByUser)
                .Include(mr => mr.RequestItems)
                    .ThenInclude(ri => ri.Medicine)
                .Where(mr => mr.Status == "Paid")
                .AsQueryable();

            if (pharmacistId.HasValue)
            {
                query = query.Where(mr => mr.PharmacistID == pharmacistId.Value);
            }

            return await query
                .OrderByDescending(mr => mr.RequestDate)
                .Select(mr => new MedicationRequestDto
                {
                    MedicationRequestID = mr.MedicationRequestID,
                    PatientID = mr.PatientID,
                    PatientName = mr.Patient.FirstName + " " + mr.Patient.LastName,
                    PharmacistID = mr.PharmacistID,
                    PharmacistName = mr.Pharmacist.FirstName + " " + mr.Pharmacist.LastName,
                    PharmacyName = mr.Pharmacist.FirstName + " " + mr.Pharmacist.LastName + " Pharmacy",
                    Symptoms = mr.Symptoms,
                    ImageUrl = mr.ImageUrl,
                    Notes = mr.Notes,
                    PharmacistNotes = mr.PharmacistNotes,
                    Status = mr.Status,
                    PrescriptionID = mr.PrescriptionID,
                    RequestDate = mr.RequestDate,
                    ReviewedDate = mr.ReviewedDate,
                    ReviewedBy = mr.ReviewedBy,
                    ReviewedByName = mr.ReviewedByUser != null ? mr.ReviewedByUser.FirstName + " " + mr.ReviewedByUser.LastName : null,
                    TotalAmount = mr.RequestItems.Sum(ri => ri.RequestedQuantity * ri.Medicine.Price),
                    RequestItems = mr.RequestItems.Select(ri => new MedicationRequestItemDto
                    {
                        RequestItemID = ri.RequestItemID,
                        MedicineID = ri.MedicineID,
                        MedicineName = ri.Medicine.MedicineName,
                        GenericName = ri.Medicine.GenericName,
                        RequestedQuantity = ri.RequestedQuantity,
                        AvailableStock = ri.Medicine.StockQuantity,
                        UnitPrice = ri.Medicine.Price,
                        Notes = ri.Notes
                    }).ToList()
                })
                .ToListAsync();
        }
    }
}

