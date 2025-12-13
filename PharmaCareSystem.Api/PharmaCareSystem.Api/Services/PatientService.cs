using Microsoft.EntityFrameworkCore;
using PharmaCareSystem.Api.Data;
using PharmaCareSystem.Api.Models;
using PharmaCareSystem.Api.DTOs.Patients;

namespace PharmaCareSystem.Api.Services
{
    public interface IPatientService
    {
        Task<List<PatientDto>> GetAllPatientsAsync();
        Task<PatientDto?> GetPatientByIdAsync(int patientId);
        Task<List<PatientDto>> SearchPatientsAsync(string searchTerm);
        Task<(bool Success, string Message, PatientDto? Data)> CreatePatientAsync(CreatePatientDto dto);
        Task<(bool Success, string Message)> UpdatePatientAsync(int patientId, CreatePatientDto dto);
        Task<(bool Success, string Message)> DeletePatientAsync(int patientId);
    }

    public class PatientService : IPatientService
    {
        private readonly PharmaCareDbContext _context;

        public PatientService(PharmaCareDbContext context)
        {
            _context = context;
        }

        public async Task<List<PatientDto>> GetAllPatientsAsync()
        {
            return await _context.Patients
                .Where(p => p.IsActive)
                .Select(p => new PatientDto
                {
                    PatientID = p.PatientID,
                    UserID = p.UserID,
                    FirstName = p.FirstName,
                    LastName = p.LastName,
                    DateOfBirth = p.DateOfBirth,
                    Gender = p.Gender,
                    PhoneNumber = p.PhoneNumber,
                    Email = p.Email,
                    Address = p.Address,
                    District = p.District,
                    Sector = p.Sector,
                    EmergencyContact = p.EmergencyContact,
                    EmergencyContactName = p.EmergencyContactName,
                    MedicalHistory = p.MedicalHistory,
                    Allergies = p.Allergies,
                    BloodType = p.BloodType,
                    IsActive = p.IsActive,
                    CreatedDate = p.CreatedDate
                })
                .ToListAsync();
        }

        public async Task<PatientDto?> GetPatientByIdAsync(int patientId)
        {
            return await _context.Patients
                .Where(p => p.PatientID == patientId && p.IsActive)
                .Select(p => new PatientDto
                {
                    PatientID = p.PatientID,
                    UserID = p.UserID,
                    FirstName = p.FirstName,
                    LastName = p.LastName,
                    DateOfBirth = p.DateOfBirth,
                    Gender = p.Gender,
                    PhoneNumber = p.PhoneNumber,
                    Email = p.Email,
                    Address = p.Address,
                    District = p.District,
                    Sector = p.Sector,
                    EmergencyContact = p.EmergencyContact,
                    EmergencyContactName = p.EmergencyContactName,
                    MedicalHistory = p.MedicalHistory,
                    Allergies = p.Allergies,
                    BloodType = p.BloodType,
                    IsActive = p.IsActive,
                    CreatedDate = p.CreatedDate
                })
                .FirstOrDefaultAsync();
        }

        public async Task<List<PatientDto>> SearchPatientsAsync(string searchTerm)
        {
            return await _context.Patients
                .Where(p => p.IsActive &&
                    (p.FirstName.Contains(searchTerm) ||
                     p.LastName.Contains(searchTerm) ||
                     p.PhoneNumber.Contains(searchTerm)))
                .Select(p => new PatientDto
                {
                    PatientID = p.PatientID,
                    UserID = p.UserID,
                    FirstName = p.FirstName,
                    LastName = p.LastName,
                    DateOfBirth = p.DateOfBirth,
                    Gender = p.Gender,
                    PhoneNumber = p.PhoneNumber,
                    Email = p.Email,
                    Address = p.Address,
                    District = p.District,
                    Sector = p.Sector,
                    EmergencyContact = p.EmergencyContact,
                    EmergencyContactName = p.EmergencyContactName,
                    MedicalHistory = p.MedicalHistory,
                    Allergies = p.Allergies,
                    BloodType = p.BloodType,
                    IsActive = p.IsActive,
                    CreatedDate = p.CreatedDate
                })
                .ToListAsync();
        }

        public async Task<(bool Success, string Message, PatientDto? Data)> CreatePatientAsync(CreatePatientDto dto)
        {
            try
            {
                var patient = new Patient
                {
                    FirstName = dto.FirstName,
                    LastName = dto.LastName,
                    DateOfBirth = dto.DateOfBirth,
                    Gender = dto.Gender,
                    PhoneNumber = dto.PhoneNumber,
                    Email = dto.Email,
                    Address = dto.Address,
                    District = dto.District,
                    Sector = dto.Sector,
                    EmergencyContact = dto.EmergencyContact,
                    EmergencyContactName = dto.EmergencyContactName,
                    MedicalHistory = dto.MedicalHistory,
                    Allergies = dto.Allergies,
                    BloodType = dto.BloodType,
                    IsActive = true
                };

                _context.Patients.Add(patient);
                await _context.SaveChangesAsync();

                var result = new PatientDto
                {
                    PatientID = patient.PatientID,
                    FirstName = patient.FirstName,
                    LastName = patient.LastName,
                    DateOfBirth = patient.DateOfBirth,
                    Gender = patient.Gender,
                    PhoneNumber = patient.PhoneNumber,
                    Email = patient.Email,
                    Address = patient.Address,
                    District = patient.District,
                    Sector = patient.Sector,
                    EmergencyContact = patient.EmergencyContact,
                    EmergencyContactName = patient.EmergencyContactName,
                    MedicalHistory = patient.MedicalHistory,
                    Allergies = patient.Allergies,
                    BloodType = patient.BloodType,
                    IsActive = patient.IsActive,
                    CreatedDate = patient.CreatedDate
                };

                return (true, "Patient created successfully", result);
            }
            catch (Exception ex)
            {
                return (false, $"Failed to create patient: {ex.Message}", null);
            }
        }

        public async Task<(bool Success, string Message)> UpdatePatientAsync(int patientId, CreatePatientDto dto)
        {
            try
            {
                var patient = await _context.Patients.FindAsync(patientId);
                if (patient == null)
                    return (false, "Patient not found");

                patient.FirstName = dto.FirstName;
                patient.LastName = dto.LastName;
                patient.DateOfBirth = dto.DateOfBirth;
                patient.Gender = dto.Gender;
                patient.PhoneNumber = dto.PhoneNumber;
                patient.Email = dto.Email;
                patient.Address = dto.Address;
                patient.District = dto.District;
                patient.Sector = dto.Sector;
                patient.EmergencyContact = dto.EmergencyContact;
                patient.EmergencyContactName = dto.EmergencyContactName;
                patient.MedicalHistory = dto.MedicalHistory;
                patient.Allergies = dto.Allergies;
                patient.BloodType = dto.BloodType;

                await _context.SaveChangesAsync();
                return (true, "Patient updated successfully");
            }
            catch (Exception ex)
            {
                return (false, $"Failed to update patient: {ex.Message}");
            }
        }

        public async Task<(bool Success, string Message)> DeletePatientAsync(int patientId)
        {
            try
            {
                var patient = await _context.Patients.FindAsync(patientId);
                if (patient == null)
                    return (false, "Patient not found");

                patient.IsActive = false;
                await _context.SaveChangesAsync();
                return (true, "Patient deleted successfully");
            }
            catch (Exception ex)
            {
                return (false, $"Failed to delete patient: {ex.Message}");
            }
        }
    }
}