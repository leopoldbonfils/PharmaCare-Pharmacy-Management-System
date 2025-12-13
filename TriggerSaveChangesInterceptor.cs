using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using System.Data.Common;
using System.Text.RegularExpressions;

namespace PharmaCareSystem.Api.Data
{
    /// <summary>
    /// Interceptor to handle database triggers that conflict with EF Core's OUTPUT clause
    /// </summary>
    public class TriggerSaveChangesInterceptor : ISaveChangesInterceptor
    {
        public InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
        {
            if (eventData.Context != null)
            {
                DisableIdentityInsert(eventData.Context);
            }
            return result;
        }

        public async ValueTask<InterceptionResult<int>> SavingChangesAsync(
            DbContextEventData eventData, 
            InterceptionResult<int> result, 
            CancellationToken cancellationToken = default)
        {
            if (eventData.Context != null)
            {
                DisableIdentityInsert(eventData.Context);
            }
            return result;
        }

        public int SavedChanges(SaveChangesCompletedEventData eventData, int result)
        {
            return result;
        }

        public ValueTask<int> SavedChangesAsync(SaveChangesCompletedEventData eventData, int result, CancellationToken cancellationToken = default)
        {
            return ValueTask.FromResult(result);
        }

        public void SaveChangesFailed(DbContextErrorEventData eventData)
        {
            Console.WriteLine($"❌ SaveChangesFailed: {eventData.Exception?.Message}");
        }

        public Task SaveChangesFailedAsync(DbContextErrorEventData eventData, CancellationToken cancellationToken = default)
        {
            Console.WriteLine($"❌ SaveChangesFailedAsync: {eventData.Exception?.Message}");
            return Task.CompletedTask;
        }

        private void DisableIdentityInsert(DbContext context)
        {
            var entries = context.ChangeTracker.Entries()
                .Where(e => e.State == EntityState.Added)
                .ToList();

            foreach (var entry in entries)
            {
                var tableName = entry.Metadata.GetTableName();
                
                // Only for tables with triggers
                if (tableName == "Messages" || tableName == "Notifications")
                {
                    Console.WriteLine($"[TriggerInterceptor] Processing {tableName} - State: {entry.State}");
                }
            }
        }
    }

    /// <summary>
    /// Command interceptor to remove OUTPUT clauses from SQL commands for tables with triggers
    /// </summary>
    public class OutputClauseRemoverInterceptor : DbCommandInterceptor
    {
        public override InterceptionResult<DbDataReader> ReaderExecuting(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<DbDataReader> result)
        {
            RemoveOutputClause(command);
            return base.ReaderExecuting(command, eventData, result);
        }

        public override ValueTask<InterceptionResult<DbDataReader>> ReaderExecutingAsync(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<DbDataReader> result,
            CancellationToken cancellationToken = default)
        {
            RemoveOutputClause(command);
            return base.ReaderExecutingAsync(command, eventData, result, cancellationToken);
        }

        public override InterceptionResult<int> NonQueryExecuting(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<int> result)
        {
            RemoveOutputClause(command);
            return base.NonQueryExecuting(command, eventData, result);
        }

        public override ValueTask<InterceptionResult<int>> NonQueryExecutingAsync(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<int> result,
            CancellationToken cancellationToken = default)
        {
            RemoveOutputClause(command);
            return base.NonQueryExecutingAsync(command, eventData, result, cancellationToken);
        }

        private void RemoveOutputClause(DbCommand command)
        {
            if (string.IsNullOrEmpty(command.CommandText))
                return;

            // Only process INSERT statements for tables with triggers
            if (!command.CommandText.Contains("INSERT", StringComparison.OrdinalIgnoreCase))
                return;

            var hasMessages = command.CommandText.Contains("[Messages]", StringComparison.OrdinalIgnoreCase) ||
                             command.CommandText.Contains("Messages", StringComparison.OrdinalIgnoreCase);
            
            var hasNotifications = command.CommandText.Contains("[Notifications]", StringComparison.OrdinalIgnoreCase) ||
                                  command.CommandText.Contains("Notifications", StringComparison.OrdinalIgnoreCase);

            if (!hasMessages && !hasNotifications)
                return;

            var originalSql = command.CommandText;
            
            Console.WriteLine($"[OutputClauseRemover] ==========================================");
            Console.WriteLine($"[OutputClauseRemover] Detected INSERT for {(hasMessages ? "Messages" : "Notifications")}");
            Console.WriteLine($"[OutputClauseRemover] Original SQL length: {originalSql.Length} chars");

            try
            {
                // Remove OUTPUT clause with multiple strategies
                var modifiedSql = originalSql;

                // Strategy 1: Remove OUTPUT INSERTED.[Column] patterns
                modifiedSql = Regex.Replace(
                    modifiedSql,
                    @"OUTPUT\s+INSERTED\.\[[^\]]+\]",
                    "",
                    RegexOptions.IgnoreCase | RegexOptions.Singleline
                );

                // Strategy 2: Remove OUTPUT ... INTO patterns
                modifiedSql = Regex.Replace(
                    modifiedSql,
                    @"OUTPUT\s+[^;]+?\s+INTO\s+[^\s;]+",
                    "",
                    RegexOptions.IgnoreCase | RegexOptions.Singleline
                );

                // Strategy 3: Remove entire OUTPUT lines
                var lines = modifiedSql.Split(new[] { "\r\n", "\n" }, StringSplitOptions.None);
                var filteredLines = lines.Where(line => 
                {
                    var trimmed = line.Trim();
                    return !trimmed.StartsWith("OUTPUT", StringComparison.OrdinalIgnoreCase);
                }).ToArray();
                
                modifiedSql = string.Join("\r\n", filteredLines);

                // Strategy 4: Remove any remaining OUTPUT with INSERTED
                modifiedSql = Regex.Replace(
                    modifiedSql,
                    @"OUTPUT\s+INSERTED\.[^\s,;)]+(\s*,\s*INSERTED\.[^\s,;)]+)*",
                    "",
                    RegexOptions.IgnoreCase | RegexOptions.Singleline
                );

                // Clean up whitespace
                modifiedSql = Regex.Replace(modifiedSql, @"\s+VALUES", "\r\nVALUES", RegexOptions.IgnoreCase);
                modifiedSql = Regex.Replace(modifiedSql, @"\r\n\s*\r\n", "\r\n", RegexOptions.Multiline);
                modifiedSql = Regex.Replace(modifiedSql, @"\s+;", ";", RegexOptions.Multiline);

                // CRITICAL FIX: Add SELECT @@ROWCOUNT after INSERT so EF Core knows 1 row was affected
                // This prevents the "expected to affect 1 row(s), but actually affected 0 row(s)" error
                if (originalSql != modifiedSql)
                {
                    // Ensure SQL ends with semicolon
                    modifiedSql = modifiedSql.TrimEnd();
                    if (!modifiedSql.EndsWith(";"))
                    {
                        modifiedSql += ";";
                    }
                    
                    // Add SELECT @@ROWCOUNT to return affected rows count to EF Core
                    modifiedSql += "\r\nSELECT @@ROWCOUNT;";
                    
                    command.CommandText = modifiedSql;
                    Console.WriteLine($"[OutputClauseRemover] ✅ OUTPUT clause REMOVED and @@ROWCOUNT added");
                    Console.WriteLine($"[OutputClauseRemover] Modified SQL length: {modifiedSql.Length} chars");
                    Console.WriteLine($"[OutputClauseRemover] ==========================================");
                }
                else
                {
                    Console.WriteLine($"[OutputClauseRemover] ⚠️ WARNING: No OUTPUT clause found to remove!");
                    Console.WriteLine($"[OutputClauseRemover] SQL: {originalSql.Substring(0, Math.Min(200, originalSql.Length))}...");
                    Console.WriteLine($"[OutputClauseRemover] ==========================================");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[OutputClauseRemover] ❌ ERROR removing OUTPUT clause: {ex.Message}");
                Console.WriteLine($"[OutputClauseRemover] Stack: {ex.StackTrace}");
            }
        }
    }
}