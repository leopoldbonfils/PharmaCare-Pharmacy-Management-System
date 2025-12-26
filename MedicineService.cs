using Microsoft.EntityFrameworkCore;
using PharmaCareSystem.Api.Data;
using PharmaCareSystem.Api.Models;
using PharmaCareSystem.Api.DTOs.Medicines;

namespace PharmaCareSystem.Api.Services
{
    public interface IMedicineService
    {
        Task<List<MedicineDto>> GetAllMedicinesAsync();
        Task<MedicineDto?> GetMedicineByIdAsync(int medicineId);
        Task<List<MedicineDto>> SearchMedicinesAsync(string searchTerm);
        Task<List<MedicineDto>> GetLowStockMedicinesAsync();
        Task<List<MedicineDto>> GetExpiringMedicinesAsync(int daysAhead);
        Task<(bool Success, string Message, MedicineDto? Data)> CreateMedicineAsync(CreateMedicineDto dto);
        Task<(bool Success, string Message)> UpdateMedicineAsync(int medicineId, CreateMedicineDto dto);
        Task<(bool Success, string Message)> UpdateStockAsync(int medicineId, int quantity, string operation);
        Task<(bool Success, string Message)> DeleteMedicineAsync(int medicineId);
    }

    public class MedicineService : IMedicineService
    {
        private readonly PharmaCareDbContext _context;

        public MedicineService(PharmaCareDbContext context)
        {
            _context = context;
        }

        public async Task<List<MedicineDto>> GetAllMedicinesAsync()
        {
            return await _context.Medicines
                .Where(m => m.IsActive)
                .Select(m => new MedicineDto
                {
                    MedicineID = m.MedicineID,
                    MedicineName = m.MedicineName,
                    GenericName = m.GenericName,
                    Manufacturer = m.Manufacturer,
                    BatchNumber = m.BatchNumber,
                    ExpiryDate = m.ExpiryDate,
                    StockQuantity = m.StockQuantity,
                    ReorderLevel = m.ReorderLevel,
                    Price = m.Price,
                    Category = m.Category,
                    Dosage = m.Dosage,
                    Description = m.Description,
                    IsActive = m.IsActive,
                    CreatedDate = m.CreatedDate,
                    LastUpdated = m.LastUpdated
                })
                .ToListAsync();
        }

        public async Task<MedicineDto?> GetMedicineByIdAsync(int medicineId)
        {
            return await _context.Medicines
                .Where(m => m.MedicineID == medicineId && m.IsActive)
                .Select(m => new MedicineDto
                {
                    MedicineID = m.MedicineID,
                    MedicineName = m.MedicineName,
                    GenericName = m.GenericName,
                    Manufacturer = m.Manufacturer,
                    BatchNumber = m.BatchNumber,
                    ExpiryDate = m.ExpiryDate,
                    StockQuantity = m.StockQuantity,
                    ReorderLevel = m.ReorderLevel,
                    Price = m.Price,
                    Category = m.Category,
                    Dosage = m.Dosage,
                    Description = m.Description,
                    IsActive = m.IsActive,
                    CreatedDate = m.CreatedDate,
                    LastUpdated = m.LastUpdated
                })
                .FirstOrDefaultAsync();
        }

        public async Task<List<MedicineDto>> SearchMedicinesAsync(string searchTerm)
        {
            return await _context.Medicines
                .Where(m => m.IsActive &&
                    (m.MedicineName.Contains(searchTerm) ||
                     m.GenericName.Contains(searchTerm) ||
                     m.Category.Contains(searchTerm)))
                .Select(m => new MedicineDto
                {
                    MedicineID = m.MedicineID,
                    MedicineName = m.MedicineName,
                    GenericName = m.GenericName,
                    Manufacturer = m.Manufacturer,
                    BatchNumber = m.BatchNumber,
                    ExpiryDate = m.ExpiryDate,
                    StockQuantity = m.StockQuantity,
                    ReorderLevel = m.ReorderLevel,
                    Price = m.Price,
                    Category = m.Category,
                    Dosage = m.Dosage,
                    Description = m.Description,
                    IsActive = m.IsActive,
                    CreatedDate = m.CreatedDate,
                    LastUpdated = m.LastUpdated
                })
                .ToListAsync();
        }

        public async Task<List<MedicineDto>> GetLowStockMedicinesAsync()
        {
            return await _context.Medicines
                .Where(m => m.IsActive && m.StockQuantity <= m.ReorderLevel)
                .Select(m => new MedicineDto
                {
                    MedicineID = m.MedicineID,
                    MedicineName = m.MedicineName,
                    GenericName = m.GenericName,
                    Manufacturer = m.Manufacturer,
                    BatchNumber = m.BatchNumber,
                    ExpiryDate = m.ExpiryDate,
                    StockQuantity = m.StockQuantity,
                    ReorderLevel = m.ReorderLevel,
                    Price = m.Price,
                    Category = m.Category,
                    Dosage = m.Dosage,
                    Description = m.Description,
                    IsActive = m.IsActive,
                    CreatedDate = m.CreatedDate,
                    LastUpdated = m.LastUpdated
                })
                .ToListAsync();
        }

        public async Task<List<MedicineDto>> GetExpiringMedicinesAsync(int daysAhead)
        {
            var futureDate = DateTime.Now.AddDays(daysAhead);
            return await _context.Medicines
                .Where(m => m.IsActive && m.ExpiryDate <= futureDate && m.ExpiryDate > DateTime.Now)
                .Select(m => new MedicineDto
                {
                    MedicineID = m.MedicineID,
                    MedicineName = m.MedicineName,
                    GenericName = m.GenericName,
                    Manufacturer = m.Manufacturer,
                    BatchNumber = m.BatchNumber,
                    ExpiryDate = m.ExpiryDate,
                    StockQuantity = m.StockQuantity,
                    ReorderLevel = m.ReorderLevel,
                    Price = m.Price,
                    Category = m.Category,
                    Dosage = m.Dosage,
                    Description = m.Description,
                    IsActive = m.IsActive,
                    CreatedDate = m.CreatedDate,
                    LastUpdated = m.LastUpdated
                })
                .ToListAsync();
        }

        public async Task<(bool Success, string Message, MedicineDto? Data)> CreateMedicineAsync(CreateMedicineDto dto)
        {
            try
            {
                var medicine = new Medicine
                {
                    MedicineName = dto.MedicineName,
                    GenericName = dto.GenericName,
                    Manufacturer = dto.Manufacturer,
                    BatchNumber = dto.BatchNumber,
                    ExpiryDate = dto.ExpiryDate,
                    StockQuantity = dto.StockQuantity,
                    ReorderLevel = dto.ReorderLevel,
                    Price = dto.Price,
                    Category = dto.Category,
                    Dosage = dto.Dosage,
                    Description = dto.Description,
                    IsActive = true
                };

                _context.Medicines.Add(medicine);
                await _context.SaveChangesAsync();

                var result = new MedicineDto
                {
                    MedicineID = medicine.MedicineID,
                    MedicineName = medicine.MedicineName,
                    GenericName = medicine.GenericName,
                    Manufacturer = medicine.Manufacturer,
                    BatchNumber = medicine.BatchNumber,
                    ExpiryDate = medicine.ExpiryDate,
                    StockQuantity = medicine.StockQuantity,
                    ReorderLevel = medicine.ReorderLevel,
                    Price = medicine.Price,
                    Category = medicine.Category,
                    Dosage = medicine.Dosage,
                    Description = medicine.Description,
                    IsActive = medicine.IsActive,
                    CreatedDate = medicine.CreatedDate,
                    LastUpdated = medicine.LastUpdated
                };

                return (true, "Medicine created successfully", result);
            }
            catch (Exception ex)
            {
                return (false, $"Failed to create medicine: {ex.Message}", null);
            }
        }

        public async Task<(bool Success, string Message)> UpdateMedicineAsync(int medicineId, CreateMedicineDto dto)
        {
            try
            {
                var medicine = await _context.Medicines.FindAsync(medicineId);
                if (medicine == null)
                    return (false, "Medicine not found");

                medicine.MedicineName = dto.MedicineName;
                medicine.GenericName = dto.GenericName;
                medicine.Manufacturer = dto.Manufacturer;
                medicine.BatchNumber = dto.BatchNumber;
                medicine.ExpiryDate = dto.ExpiryDate;
                medicine.StockQuantity = dto.StockQuantity;
                medicine.ReorderLevel = dto.ReorderLevel;
                medicine.Price = dto.Price;
                medicine.Category = dto.Category;
                medicine.Dosage = dto.Dosage;
                medicine.Description = dto.Description;
                medicine.LastUpdated = DateTime.Now;

                await _context.SaveChangesAsync();
                return (true, "Medicine updated successfully");
            }
            catch (Exception ex)
            {
                return (false, $"Failed to update medicine: {ex.Message}");
            }
        }

        public async Task<(bool Success, string Message)> UpdateStockAsync(int medicineId, int quantity, string operation)
        {
            try
            {
                var medicine = await _context.Medicines.FindAsync(medicineId);
                if (medicine == null)
                    return (false, "Medicine not found");

                if (operation == "ADD")
                    medicine.StockQuantity += quantity;
                else if (operation == "SUBTRACT")
                {
                    if (medicine.StockQuantity < quantity)
                        return (false, "Insufficient stock");
                    medicine.StockQuantity -= quantity;
                }

                medicine.LastUpdated = DateTime.Now;
                await _context.SaveChangesAsync();
                return (true, "Stock updated successfully");
            }
            catch (Exception ex)
            {
                return (false, $"Failed to update stock: {ex.Message}");
            }
        }

        public async Task<(bool Success, string Message)> DeleteMedicineAsync(int medicineId)
        {
            try
            {
                var medicine = await _context.Medicines.FindAsync(medicineId);
                if (medicine == null)
                    return (false, "Medicine not found");

                medicine.IsActive = false;
                await _context.SaveChangesAsync();
                return (true, "Medicine deleted successfully");
            }
            catch (Exception ex)
            {
                return (false, $"Failed to delete medicine: {ex.Message}");
            }
        }
    }
}