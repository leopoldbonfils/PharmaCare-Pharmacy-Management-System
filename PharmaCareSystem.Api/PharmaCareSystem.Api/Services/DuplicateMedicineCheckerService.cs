using Microsoft.EntityFrameworkCore;
using PharmaCareSystem.Api.Data;
using PharmaCareSystem.Api.DTOs.Prescriptions;

namespace PharmaCareSystem.Api.Services
{
    public interface IDuplicateMedicineCheckerService
    {
        Task<List<PrescriptionAlertDto>> CheckForAlertsAsync(int patientId, CreatePrescriptionDto newPrescription);
    }

    public class DuplicateMedicineCheckerService : IDuplicateMedicineCheckerService
    {
        private readonly PharmaCareDbContext _context;

        public DuplicateMedicineCheckerService(PharmaCareDbContext context)
        {
            _context = context;
        }

        public async Task<List<PrescriptionAlertDto>> CheckForAlertsAsync(int patientId, CreatePrescriptionDto newPrescription)
        {
            var alerts = new List<PrescriptionAlertDto>();

            // Get all recent prescriptions for this patient
            var recentPrescriptions = await _context.Prescriptions
                .Include(p => p.PrescriptionItems)
                    .ThenInclude(pi => pi.Medicine)
                .Where(p => p.PatientID == patientId && p.Status != "Cancelled")
                .OrderByDescending(p => p.PrescriptionDate)
                .ToListAsync();

            var today = DateTime.Now.Date;
            var sevenDaysAgo = today.AddDays(-7);

            // Check each medicine in the new prescription
            foreach (var newItem in newPrescription.Items)
            {
                var medicine = await _context.Medicines.FindAsync(newItem.MedicineID);
                if (medicine == null) continue;

                var medicineName = medicine.MedicineName.ToLower();
                var isAntibiotic = medicineName.Contains("antibiotic") || 
                                  medicineName.Contains("amoxicillin") ||
                                  medicineName.Contains("penicillin") ||
                                  medicineName.Contains("cephalexin") ||
                                  medicineName.Contains("azithromycin") ||
                                  medicineName.Contains("ciprofloxacin");

                // Check 1: Same medicine prescribed today
                var todayPrescriptions = recentPrescriptions
                    .Where(p => p.PrescriptionDate.Date == today && 
                                p.Status != "Cancelled")
                    .ToList();

                foreach (var todayPrescription in todayPrescriptions)
                {
                    var duplicateItem = todayPrescription.PrescriptionItems
                        .FirstOrDefault(pi => pi.MedicineID == newItem.MedicineID);

                    if (duplicateItem != null)
                    {
                        alerts.Add(new PrescriptionAlertDto
                        {
                            Type = "Duplicate",
                            Severity = "Warning",
                            Message = $"Patient already received {medicine.MedicineName} today (Prescription #{todayPrescription.PrescriptionID}). This may cause overdose.",
                            PrescriptionId = todayPrescription.PrescriptionID,
                            MedicineName = medicine.MedicineName
                        });
                    }
                }

                // Check 2: Antibiotic prescribed twice within 7 days
                if (isAntibiotic)
                {
                    var recentAntibioticPrescriptions = recentPrescriptions
                        .Where(p => p.PrescriptionDate >= sevenDaysAgo && 
                                    p.Status != "Cancelled")
                        .ToList();

                    foreach (var recentPrescription in recentAntibioticPrescriptions)
                    {
                        var antibioticItem = recentPrescription.PrescriptionItems
                            .FirstOrDefault(pi => 
                            {
                                var med = _context.Medicines.Find(pi.MedicineID);
                                if (med == null) return false;
                                var medName = med.MedicineName.ToLower();
                                return medName.Contains("antibiotic") || 
                                       medName.Contains("amoxicillin") ||
                                       medName.Contains("penicillin") ||
                                       medName.Contains("cephalexin") ||
                                       medName.Contains("azithromycin") ||
                                       medName.Contains("ciprofloxacin");
                            });

                        if (antibioticItem != null)
                        {
                            alerts.Add(new PrescriptionAlertDto
                            {
                                Type = "Antibiotic",
                                Severity = "Warning",
                                Message = $"Patient received antibiotics within the last 7 days (Prescription #{recentPrescription.PrescriptionID} on {recentPrescription.PrescriptionDate:yyyy-MM-dd}). Multiple antibiotic courses may cause resistance.",
                                PrescriptionId = recentPrescription.PrescriptionID,
                                MedicineName = medicine.MedicineName
                            });
                        }
                    }
                }
            }

            // Check 3: Too many active prescriptions
            var activePrescriptions = recentPrescriptions
                .Count(p => (p.Status == "Pending" || p.Status == "Approved") && 
                            p.PrescriptionDate >= today.AddDays(-30));

            if (activePrescriptions >= 5)
            {
                alerts.Add(new PrescriptionAlertDto
                {
                    Type = "ActivePrescriptions",
                    Severity = "Info",
                    Message = $"Patient has {activePrescriptions} active prescriptions in the last 30 days. Consider reviewing before adding more.",
                    PrescriptionId = null,
                    MedicineName = null
                });
            }

            return alerts;
        }
    }
}

