function toCents(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 0;
  }
  return Math.round(Number(amount) * 100);
}

function fromCents(cents) {
  if (cents === null || cents === undefined || isNaN(cents)) {
    return 0;
  }
  return Math.round(cents) / 100;
}

function roundMoney(amount) {
  return fromCents(toCents(amount));
}

function formatCurrency(amount) {
  return roundMoney(amount).toFixed(2);
}

function calculateDebt(monthlyFee, totalPaid) {
  const feeCents = toCents(monthlyFee);
  const paidCents = toCents(totalPaid);
  const debtCents = Math.max(0, feeCents - paidCents);
  return fromCents(debtCents);
}

module.exports = {
  toCents,
  fromCents,
  roundMoney,
  formatCurrency,
  calculateDebt
};
