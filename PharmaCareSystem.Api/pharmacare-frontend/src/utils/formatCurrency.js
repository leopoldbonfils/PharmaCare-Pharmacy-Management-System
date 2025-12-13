export const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'RWF 0';
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };