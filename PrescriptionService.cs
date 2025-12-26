using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using PharmaCareSystem.Api.Data;
using PharmaCareSystem.Api.Models;
using PharmaCareSystem.Api.DTOs.Prescriptions;

namespace PharmaCareSystem.Api.Services
{
    public interface IPrescriptionService
    {
        Task<List<PrescriptionDto>> GetAllPrescriptionsAsync();
        Task<PrescriptionDto?> GetPrescriptionByIdAsync(int prescriptionId);
        Task<List<PrescriptionDto>> GetPrescriptionsByPatientAsync(int patientId);
        Task<(bool Success, string Message, PrescriptionDto? Data)> CreatePrescriptionAsync(CreatePrescriptionDto dto, int createdBy);
        Task<(bool Success, string Message)> UpdateStatusAsync(int prescriptionId, string status, int? dispensedBy);
    }

    public class PrescriptionService : IPrescriptionService
    {
        private readonly PharmaCareDbContext _context;

        public PrescriptionService(PharmaCareDbContext context)
        {
            _context = context;
        }

        public async Task<List<PrescriptionDto>> GetAllPrescriptionsAsync()
        {
            return await _context.Prescriptions
                .Include(p => p.Patient)
                .Include(p => p.CreatedByUser)
                .Include(p => p.DispensedByUser)
                .Include(p => p.PrescriptionItems)
                    .ThenInclude(pi => pi.Medicine)
                .Select(p => new PrescriptionDto
                {
                    PrescriptionID = p.PrescriptionID,
                    PatientID = p.PatientID,
                    PatientName = p.Patient.FirstName + " " + p.Patient.LastName,
                    DoctorName = p.DoctorName,
                    DoctorContact = p.DoctorContact,
                    HospitalName = p.HospitalName,
                    PrescriptionDate = p.PrescriptionDate,
                    Diagnosis = p.Diagnosis,
                    Status = p.Status,
                    Instructions = p.Instructions,
                    CreatedBy = p.CreatedBy,
                    CreatedByName = p.CreatedByUser.FirstName + " " + p.CreatedByUser.LastName,
                    CreatedDate = p.CreatedDate,
                    DispensedDate = p.DispensedDate,
                    DispensedBy = p.DispensedBy,
                    DispensedByName = p.DispensedByUser != null ? p.DispensedByUser.FirstName + " " + p.DispensedByUser.LastName : null,
                    PrescriptionImageUrl = p.PrescriptionImageUrl,
                    Items = p.PrescriptionItems.Select(pi => new PrescriptionItemDto
                    {
                        PrescriptionItemID = pi.PrescriptionItemID,
                        MedicineID = pi.MedicineID,
                        MedicineName = pi.Medicine.MedicineName,
                        GenericName = pi.Medicine.GenericName,
                        Dosage = pi.Dosage,
                        Frequency = pi.Frequency,
                        Duration = pi.Duration,
                        Quantity = pi.Quantity,
                        UnitPrice = pi.Medicine.Price,
                        Instructions = pi.Instructions
                    }).ToList()
                })
                .ToListAsync();
        }

        public async Task<PrescriptionDto?> GetPrescriptionByIdAsync(int prescriptionId)
        {
            return await _context.Prescriptions
                .Include(p => p.Patient)
                .Include(p => p.CreatedByUser)
                .Include(p => p.DispensedByUser)
                .Include(p => p.PrescriptionItems)
                    .ThenInclude(pi => pi.Medicine)
                .Where(p => p.PrescriptionID == prescriptionId)
                .Select(p => new PrescriptionDto
                {
                    PrescriptionID = p.PrescriptionID,
                    PatientID = p.PatientID,
                    PatientName = p.Patient.FirstName + " " + p.Patient.LastName,
                    DoctorName = p.DoctorName,
                    DoctorContact = p.DoctorContact,
                    HospitalName = p.HospitalName,
                    PrescriptionDate = p.PrescriptionDate,
                    Diagnosis = p.Diagnosis,
                    Status = p.Status,
                    Instructions = p.Instructions,
                    CreatedBy = p.CreatedBy,
                    CreatedByName = p.CreatedByUser.FirstName + " " + p.CreatedByUser.LastName,
                    CreatedDate = p.CreatedDate,
                    DispensedDate = p.DispensedDate,
                    DispensedBy = p.DispensedBy,
                    DispensedByName = p.DispensedByUser != null ? p.DispensedByUser.FirstName + " " + p.DispensedByUser.LastName : null,
                    PrescriptionImageUrl = p.PrescriptionImageUrl,
                    Items = p.PrescriptionItems.Select(pi => new PrescriptionItemDto
                    {
                        PrescriptionItemID = pi.PrescriptionItemID,
                        MedicineID = pi.MedicineID,
                        MedicineName = pi.Medicine.MedicineName,
                        GenericName = pi.Medicine.GenericName,
                        Dosage = pi.Dosage,
                        Frequency = pi.Frequency,
                        Duration = pi.Duration,
                        Quantity = pi.Quantity,
                        UnitPrice = pi.Medicine.Price,
                        Instructions = pi.Instructions
                    }).ToList()
                })
                .FirstOrDefaultAsync();
        }

        public async Task<List<PrescriptionDto>> GetPrescriptionsByPatientAsync(int patientId)
        {
            return await _context.Prescriptions
                .Include(p => p.Patient)
                .Include(p => p.CreatedByUser)
                .Include(p => p.PrescriptionItems)
                    .ThenInclude(pi => pi.Medicine)
                .Where(p => p.PatientID == patientId)
                .Select(p => new PrescriptionDto
                {
                    PrescriptionID = p.PrescriptionID,
                    PatientID = p.PatientID,
                    PatientName = p.Patient.FirstName + " " + p.Patient.LastName,
                    DoctorName = p.DoctorName,
                    DoctorContact = p.DoctorContact,
                    HospitalName = p.HospitalName,
                    PrescriptionDate = p.PrescriptionDate,
                    Diagnosis = p.Diagnosis,
                    Status = p.Status,
                    Instructions = p.Instructions,
                    CreatedBy = p.CreatedBy,
                    CreatedByName = p.CreatedByUser.FirstName + " " + p.CreatedByUser.LastName,
                    CreatedDate = p.CreatedDate,
                    Items = p.PrescriptionItems.Select(pi => new PrescriptionItemDto
                    {
                        PrescriptionItemID = pi.PrescriptionItemID,
                        MedicineID = pi.MedicineID,
                        MedicineName = pi.Medicine.MedicineName,
                        GenericName = pi.Medicine.GenericName,
                        Dosage = pi.Dosage,
                        Frequency = pi.Frequency,
                        Duration = pi.Duration,
                        Quantity = pi.Quantity,
                        UnitPrice = pi.Medicine.Price,
                        Instructions = pi.Instructions
                    }).ToList()
                })
                .ToListAsync();
        }

        public async Task<(bool Success, string Message, PrescriptionDto? Data)> CreatePrescriptionAsync(CreatePrescriptionDto dto, int createdBy)
        {
            try
            {
                // Validate that the createdBy user exists
                var userExists = await _context.Users.AnyAsync(u => u.UserID == createdBy && u.IsActive);
                if (!userExists)
                {
                    return (false, "Invalid user. Please log in again.", null);
                }

                // Validate patient exists
                var patientExists = await _context.Patients.AnyAsync(p => p.PatientID == dto.PatientID && p.IsActive);
                if (!patientExists)
                {
                    return (false, "Patient not found or inactive.", null);
                }

                // Validate medicines exist
                foreach (var item in dto.Items)
                {
                    var medicineExists = await _context.Medicines.AnyAsync(m => m.MedicineID == item.MedicineID && m.IsActive);
                    if (!medicineExists)
                    {
                        return (false, $"Medicine with ID {item.MedicineID} not found or inactive.", null);
                    }
                }

                // Create prescription (EF Core will handle transaction automatically with retry strategy)
                var prescription = new Prescription
                {
                    PatientID = dto.PatientID,
                    DoctorName = dto.DoctorName,
                    DoctorContact = dto.DoctorContact,
                    HospitalName = dto.HospitalName,
                    PrescriptionDate = DateTime.Now.Date,
                    Diagnosis = dto.Diagnosis,
                    Status = "Pending",
                    Instructions = dto.Instructions,
                    PrescriptionImageUrl = dto.PrescriptionImageUrl,
                    CreatedBy = createdBy,
                    CreatedDate = DateTime.Now
                };

                _context.Prescriptions.Add(prescription);
                await _context.SaveChangesAsync();

                // Add prescription items
                foreach (var item in dto.Items)
                {
                    var prescriptionItem = new PrescriptionItem
                    {
                        PrescriptionID = prescription.PrescriptionID,
                        MedicineID = item.MedicineID,
                        Dosage = item.Dosage,
                        Frequency = item.Frequency,
                        Duration = item.Duration,
                        Quantity = item.Quantity,
                        Instructions = item.Instructions
                    };
                    _context.PrescriptionItems.Add(prescriptionItem);
                }

                await _context.SaveChangesAsync();

                var result = await GetPrescriptionByIdAsync(prescription.PrescriptionID);
                return (true, "Prescription created successfully", result);
            }
            catch (Microsoft.Data.SqlClient.SqlException sqlEx)
            {
                return (false, $"Database error: {sqlEx.Message}", null);
            }
            catch (DbUpdateException dbEx)
            {
                var innerEx = dbEx.InnerException;
                var errorMessage = innerEx?.Message ?? dbEx.Message;
                return (false, $"Failed to save prescription: {errorMessage}", null);
            }
            catch (Exception ex)
            {
                return (false, $"Failed to create prescription: {ex.Message}", null);
            }
        }

        public async Task<(bool Success, string Message)> UpdateStatusAsync(int prescriptionId, string status, int? dispensedBy)
        {
            try
            {
                var prescription = await _context.Prescriptions.FindAsync(prescriptionId);
                if (prescription == null)
                    return (false, "Prescription not found");

                prescription.Status = status;
                if (status == "Dispensed")
                {
                    prescription.DispensedDate = DateTime.Now;
                    prescription.DispensedBy = dispensedBy;
                }

                await _context.SaveChangesAsync();
                return (true, "Prescription status updated successfully");
            }
            catch (Exception ex)
            {
                return (false, $"Failed to update status: {ex.Message}");
            }
        }
    }
}