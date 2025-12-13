using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using PharmaCareSystem.Api.Models;

namespace PharmaCareSystem.Api.Data
{
    public class PharmaCareDbContext : DbContext
    {
        public PharmaCareDbContext(DbContextOptions<PharmaCareDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Patient> Patients { get; set; }
        public DbSet<Medicine> Medicines { get; set; }
        public DbSet<Prescription> Prescriptions { get; set; }
        public DbSet<PrescriptionItem> PrescriptionItems { get; set; }
        public DbSet<Sale> Sales { get; set; }
        public DbSet<SaleItem> SaleItems { get; set; }
        public DbSet<MedicationRequest> MedicationRequests { get; set; }
        public DbSet<MedicationRequestItem> MedicationRequestItems { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<Message> Messages { get; set; }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            // Track entries that need ID retrieval after insert
            var messageEntries = ChangeTracker.Entries<Message>()
                .Where(e => e.State == EntityState.Added)
                .ToList();
            
            var notificationEntries = ChangeTracker.Entries<Notification>()
                .Where(e => e.State == EntityState.Added)
                .ToList();

            // Save changes - the interceptor will handle the OUTPUT clause removal
            var result = await base.SaveChangesAsync(cancellationToken);

            // After save, try to reload IDs for entities that were inserted
            // Messages
            foreach (var entry in messageEntries)
            {
                if (entry.Entity.MessageID == 0) // ID not set
                {
                    try
                    {
                        // Try simple reload first
                        await entry.ReloadAsync(cancellationToken);
                    }
                    catch
                    {
                        // If reload fails, query by unique attributes
                        try
                        {
                            var reloaded = await Messages
                                .AsNoTracking()
                                .Where(m => m.SenderID == entry.Entity.SenderID &&
                                           m.ReceiverID == entry.Entity.ReceiverID &&
                                           m.MessageText == entry.Entity.MessageText)
                                .OrderByDescending(m => m.MessageID)
                                .FirstOrDefaultAsync(cancellationToken);
                            
                            if (reloaded != null)
                            {
                                entry.Entity.MessageID = reloaded.MessageID;
                            }
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"⚠️ Warning: Could not reload Message ID: {ex.Message}");
                            // Continue anyway - the message was saved successfully
                        }
                    }
                }
            }

            // Notifications
            foreach (var entry in notificationEntries)
            {
                if (entry.Entity.NotificationID == 0) // ID not set
                {
                    try
                    {
                        // Try simple reload first
                        await entry.ReloadAsync(cancellationToken);
                    }
                    catch
                    {
                        // If reload fails, query by unique attributes
                        try
                        {
                            var reloaded = await Notifications
                                .AsNoTracking()
                                .Where(n => n.UserID == entry.Entity.UserID &&
                                           n.Title == entry.Entity.Title &&
                                           n.Message == entry.Entity.Message)
                                .OrderByDescending(n => n.NotificationID)
                                .FirstOrDefaultAsync(cancellationToken);
                            
                            if (reloaded != null)
                            {
                                entry.Entity.NotificationID = reloaded.NotificationID;
                            }
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"⚠️ Warning: Could not reload Notification ID: {ex.Message}");
                            // Continue anyway - the notification was saved successfully
                        }
                    }
                }
            }

            return result;
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User Configuration
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.UserID);
                entity.HasIndex(e => e.Username).IsUnique();
                entity.HasIndex(e => e.Email).IsUnique();
            });

            // Patient Configuration
            modelBuilder.Entity<Patient>(entity =>
            {
                entity.HasKey(e => e.PatientID);
                entity.HasOne(p => p.User)
                      .WithOne(u => u.Patient)
                      .HasForeignKey<Patient>(p => p.UserID)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            // Prescription Configuration
            modelBuilder.Entity<Prescription>(entity =>
            {
                entity.HasKey(e => e.PrescriptionID);
                entity.HasOne(p => p.Patient)
                      .WithMany(pt => pt.Prescriptions)
                      .HasForeignKey(p => p.PatientID)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(p => p.CreatedByUser)
                      .WithMany(u => u.CreatedPrescriptions)
                      .HasForeignKey(p => p.CreatedBy)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(p => p.DispensedByUser)
                      .WithMany(u => u.DispensedPrescriptions)
                      .HasForeignKey(p => p.DispensedBy)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // PrescriptionItem Configuration
            modelBuilder.Entity<PrescriptionItem>(entity =>
            {
                entity.HasKey(e => e.PrescriptionItemID);
                entity.HasOne(pi => pi.Prescription)
                      .WithMany(p => p.PrescriptionItems)
                      .HasForeignKey(pi => pi.PrescriptionID)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(pi => pi.Medicine)
                      .WithMany(m => m.PrescriptionItems)
                      .HasForeignKey(pi => pi.MedicineID)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Sale Configuration
            modelBuilder.Entity<Sale>(entity =>
            {
                entity.HasKey(e => e.SaleID);
                entity.HasIndex(e => e.InvoiceNumber).IsUnique();
                
                // Configure InvoiceNumber
                entity.Property(e => e.InvoiceNumber)
                      .HasMaxLength(50)
                      .IsRequired();
                
                // If InvoiceNumber is computed in database, we need to use a trigger or set it via raw SQL
                // For now, configure to allow manual setting - if DB rejects it, we'll use a different approach
                
                entity.HasOne(s => s.Patient)
                      .WithMany(p => p.Sales)
                      .HasForeignKey(s => s.PatientID)
                      .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(s => s.SoldByUser)
                      .WithMany(u => u.Sales)
                      .HasForeignKey(s => s.SoldBy)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(s => s.MedicationRequest)
                      .WithMany()
                      .HasForeignKey(s => s.MedicationRequestID)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            // SaleItem Configuration
            modelBuilder.Entity<SaleItem>(entity =>
            {
                entity.HasKey(e => e.SaleItemID);
                entity.HasOne(si => si.Sale)
                      .WithMany(s => s.SaleItems)
                      .HasForeignKey(si => si.SaleID)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(si => si.Medicine)
                      .WithMany(m => m.SaleItems)
                      .HasForeignKey(si => si.MedicineID)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // MedicationRequest Configuration
            modelBuilder.Entity<MedicationRequest>(entity =>
            {
                entity.HasKey(e => e.MedicationRequestID);
                entity.HasOne(mr => mr.Patient)
                      .WithMany()
                      .HasForeignKey(mr => mr.PatientID)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(mr => mr.Pharmacist)
                      .WithMany()
                      .HasForeignKey(mr => mr.PharmacistID)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(mr => mr.ReviewedByUser)
                      .WithMany()
                      .HasForeignKey(mr => mr.ReviewedBy)
                      .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(mr => mr.Prescription)
                      .WithMany()
                      .HasForeignKey(mr => mr.PrescriptionID)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            // MedicationRequestItem Configuration
            modelBuilder.Entity<MedicationRequestItem>(entity =>
            {
                entity.HasKey(e => e.RequestItemID);
                entity.HasOne(mri => mri.MedicationRequest)
                      .WithMany(mr => mr.RequestItems)
                      .HasForeignKey(mri => mri.MedicationRequestID)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(mri => mri.Medicine)
                      .WithMany(m => m.MedicationRequestItems)
                      .HasForeignKey(mri => mri.MedicineID)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Payment Configuration
            modelBuilder.Entity<Payment>(entity =>
            {
                entity.HasKey(e => e.PaymentID);
                entity.HasIndex(e => e.TransactionRef).IsUnique(false);
                entity.HasOne(p => p.Patient)
                      .WithMany()
                      .HasForeignKey(p => p.PatientID)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(p => p.Prescription)
                      .WithMany()
                      .HasForeignKey(p => p.PrescriptionID)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(p => p.MedicationRequest)
                      .WithMany()
                      .HasForeignKey(p => p.MedicationRequestID)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Notification Configuration
            modelBuilder.Entity<Notification>(entity =>
            {
                entity.HasKey(e => e.NotificationID);
                
                entity.Property(e => e.NotificationID)
                      .ValueGeneratedOnAdd();
                
                entity.HasOne(n => n.User)
                      .WithMany()
                      .HasForeignKey(n => n.UserID)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Message Configuration
            modelBuilder.Entity<Message>(entity =>
            {
                entity.HasKey(e => e.MessageID);
                
                entity.Property(e => e.MessageID)
                      .HasColumnName("MessageID")
                      .ValueGeneratedOnAdd();
                
                entity.Property(e => e.SenderID).HasColumnName("SenderID");
                entity.Property(e => e.ReceiverID).HasColumnName("ReceiverID");
                entity.Property(e => e.PrescriptionID).HasColumnName("PrescriptionID");
                entity.Property(e => e.MessageText).HasColumnName("MessageText").HasColumnType("NVARCHAR(MAX)");
                entity.Property(e => e.IsRead).HasColumnName("IsRead");
                entity.Property(e => e.SentDate).HasColumnName("SentDate");
                entity.Property(e => e.ReadDate).HasColumnName("ReadDate");
                entity.Property(e => e.MessageType).HasColumnName("MessageType").HasMaxLength(20);
                entity.Property(e => e.ReplyToMessageID).HasColumnName("ReplyToMessageID");
                entity.Property(e => e.AttachmentUrl).HasColumnName("AttachmentUrl").HasMaxLength(500);
                entity.Property(e => e.AttachmentFileName).HasColumnName("AttachmentFileName").HasMaxLength(255);
                entity.Property(e => e.AttachmentFileType).HasColumnName("AttachmentFileType").HasMaxLength(50);
                
                entity.HasOne(m => m.Sender)
                      .WithMany()
                      .HasForeignKey(m => m.SenderID)
                      .OnDelete(DeleteBehavior.Restrict);
                
                entity.HasOne(m => m.Receiver)
                      .WithMany()
                      .HasForeignKey(m => m.ReceiverID)
                      .OnDelete(DeleteBehavior.Restrict);
                
                entity.HasOne(m => m.Prescription)
                      .WithMany()
                      .HasForeignKey(m => m.PrescriptionID)
                      .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(m => m.ReplyToMessage)
                      .WithMany()
                      .HasForeignKey(m => m.ReplyToMessageID)
                      .OnDelete(DeleteBehavior.NoAction);

                entity.HasIndex(e => e.SenderID);
                entity.HasIndex(e => e.ReceiverID);
                entity.HasIndex(e => e.PrescriptionID);
                entity.HasIndex(e => e.ReplyToMessageID);
                entity.HasIndex(e => e.IsRead);
                entity.HasIndex(e => e.SentDate);
            });
        }
    }
}