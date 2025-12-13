namespace PharmaCareSystem.Api.Helpers
{
    public static class InvoiceGenerator
    {
        public static string GenerateInvoiceNumber(int lastNumber)
        {
            var year = DateTime.Now.Year;
            var nextNumber = lastNumber + 1;
            return $"INV-{year}-{nextNumber:D3}";
        }
    }
}