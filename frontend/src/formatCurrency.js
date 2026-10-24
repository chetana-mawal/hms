const indianRupees = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

const formatCurrency = (amount) => indianRupees.format(Number(amount) || 0);

export default formatCurrency;
