const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  toCents,
  fromCents,
  roundMoney,
  calculateDebt,
  formatCurrency
} = require('../src/utils/money');
const {
  isValidCalendarDate,
  isValidPositiveAmount,
  validateMonthParam,
  getMonthDateRange
} = require('../src/utils/validation');

describe('Monetary Precision & Money Utils', () => {
  it('converts between amounts and integer cents without floating point drift', () => {
    assert.equal(toCents(0.1 + 0.2), 30);
    assert.equal(toCents(150.25), 15025);
    assert.equal(fromCents(15025), 150.25);
    assert.equal(formatCurrency(150.2), '150.20');
  });

  it('correctly calculates debt and enforces max(0, fee - paid)', () => {
    assert.equal(calculateDebt(100.00, 40.00), 60.00);
    assert.equal(calculateDebt(100.00, 100.00), 0.00);
    assert.equal(calculateDebt(100.00, 150.00), 0.00);
    assert.equal(calculateDebt(99.99, 33.33), 66.66);
    assert.equal(calculateDebt(150.00, 0), 150.00);
  });
});

describe('Date & Month Validation Utils', () => {
  it('correctly identifies valid and invalid calendar dates including leap years', () => {
    assert.equal(isValidCalendarDate('2026-10-27'), true);
    assert.equal(isValidCalendarDate('2024-02-29'), true);
    assert.equal(isValidCalendarDate('2023-02-29'), false);
    assert.equal(isValidCalendarDate('2026-04-31'), false);
    assert.equal(isValidCalendarDate('2026-13-01'), false);
    assert.equal(isValidCalendarDate('not-a-date'), false);
  });

  it('correctly validates positive amounts', () => {
    assert.equal(isValidPositiveAmount('100'), true);
    assert.equal(isValidPositiveAmount(150.5), true);
    assert.equal(isValidPositiveAmount('199.99'), true);
    assert.equal(isValidPositiveAmount('0'), false);
    assert.equal(isValidPositiveAmount(-10), false);
    assert.equal(isValidPositiveAmount('100.999'), false);
    assert.equal(isValidPositiveAmount(''), false);
    assert.equal(isValidPositiveAmount(NaN), false);
  });

  it('computes exact month date ranges for 28, 29, 30, and 31-day months', () => {
    assert.deepEqual(getMonthDateRange('2026-02'), {
      startDate: '2026-02-01',
      endDate: '2026-02-28'
    });
    assert.deepEqual(getMonthDateRange('2024-02'), {
      startDate: '2024-02-01',
      endDate: '2024-02-29'
    });
    assert.deepEqual(getMonthDateRange('2026-04'), {
      startDate: '2026-04-01',
      endDate: '2026-04-30'
    });
    assert.deepEqual(getMonthDateRange('2026-10'), {
      startDate: '2026-10-01',
      endDate: '2026-10-31'
    });
  });

  it('validates month query parameter format and ranges', () => {
    assert.equal(validateMonthParam('2026-10').valid, true);
    assert.equal(validateMonthParam('').valid, false);
    assert.equal(validateMonthParam(null).valid, false);
    assert.equal(validateMonthParam('2026-13').valid, false);
    assert.equal(validateMonthParam('2026-0').valid, false);
    assert.equal(validateMonthParam('1800-01').valid, false);
  });
});
