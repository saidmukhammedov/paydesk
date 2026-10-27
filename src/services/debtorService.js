const PaymentRepository = require('../repositories/paymentRepository');
const { validateMonthParam, getMonthDateRange } = require('../utils/validation');
const { calculateDebt, roundMoney } = require('../utils/money');
const { BadRequestError } = require('../utils/errors');

class DebtorService {
  constructor(paymentRepository = new PaymentRepository()) {
    this.paymentRepo = paymentRepository;
  }

  async getMonthlyDebtors(monthParam) {
    const validation = validateMonthParam(monthParam);
    if (!validation.valid) {
      throw new BadRequestError(validation.error);
    }

    const { month } = validation;
    const { startDate, endDate } = getMonthDateRange(month);

    const studentAggregates = await this.paymentRepo.getMonthlyAggregation(startDate, endDate);

    const debtors = [];
    for (const record of studentAggregates) {
      const monthlyFee = roundMoney(record.monthly_fee);
      const totalPaid = roundMoney(record.total_paid);
      const debt = calculateDebt(monthlyFee, totalPaid);

      if (debt > 0) {
        debtors.push({
          id: record.id,
          full_name: record.full_name,
          phone_number: record.phone_number,
          group_name: record.group_name,
          monthly_fee: monthlyFee,
          total_paid: totalPaid,
          debt: debt
        });
      }
    }

    return debtors;
  }
}

module.exports = DebtorService;
