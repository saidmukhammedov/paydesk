const { roundMoney } = require('./money');

const PHONE_REGEX = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{4,20}$/;
const DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

function isValidCalendarDate(dateStr) {
  if (typeof dateStr !== 'string' || !DATE_REGEX.test(dateStr)) {
    return false;
  }
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (year < 1900 || year > 2100) return false;

  const utcDate = new Date(Date.UTC(year, month - 1, day));
  return (
    utcDate.getUTCFullYear() === year &&
    utcDate.getUTCMonth() === month - 1 &&
    utcDate.getUTCDate() === day
  );
}

function isValidPositiveAmount(value) {
  if (value === null || value === undefined || value === '') return false;
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return false;

  const str = String(value).trim();
  const decimalParts = str.split('.');
  if (decimalParts.length === 2 && decimalParts[1].length > 2) {
    return false;
  }
  return true;
}

function validateMonthParam(month) {
  if (!month || typeof month !== 'string') {
    return {
      valid: false,
      error: 'Query parameter "month" is required and must be in YYYY-MM format.'
    };
  }

  const trimmed = month.trim();
  if (!MONTH_REGEX.test(trimmed)) {
    return {
      valid: false,
      error: 'Invalid "month" format. Expected format is YYYY-MM (e.g. 2026-10).'
    };
  }

  const [yearStr] = trimmed.split('-');
  const year = parseInt(yearStr, 10);
  if (year < 1900 || year > 2100) {
    return {
      valid: false,
      error: 'Year in "month" parameter must be between 1900 and 2100.'
    };
  }

  return { valid: true, month: trimmed };
}

function getMonthDateRange(monthStr) {
  const [yearStr, monthNumStr] = monthStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthNumStr, 10);

  const startDate = `${yearStr}-${monthNumStr.padStart(2, '0')}-01`;
  const lastDayObj = new Date(Date.UTC(year, month, 0));
  const lastDay = String(lastDayObj.getUTCDate()).padStart(2, '0');
  const endDate = `${yearStr}-${monthNumStr.padStart(2, '0')}-${lastDay}`;

  return { startDate, endDate };
}

function validateStudentInput(data, isUpdate = false) {
  const errors = [];
  const sanitized = {};

  if (data.full_name !== undefined || !isUpdate) {
    if (typeof data.full_name !== 'string' || !data.full_name.trim()) {
      errors.push('Full name is required and cannot be empty.');
    } else if (data.full_name.trim().length > 150) {
      errors.push('Full name must be at most 150 characters.');
    } else {
      sanitized.full_name = data.full_name.trim();
    }
  }

  if (data.phone_number !== undefined || !isUpdate) {
    if (typeof data.phone_number !== 'string' || !data.phone_number.trim()) {
      errors.push('Phone number is required and cannot be empty.');
    } else {
      const cleanPhone = data.phone_number.trim();
      if (!PHONE_REGEX.test(cleanPhone)) {
        errors.push('Phone number format is invalid.');
      } else {
        sanitized.phone_number = cleanPhone;
      }
    }
  }

  if (data.group_name !== undefined || !isUpdate) {
    if (typeof data.group_name !== 'string' || !data.group_name.trim()) {
      errors.push('Group name is required and cannot be empty.');
    } else if (data.group_name.trim().length > 100) {
      errors.push('Group name must be at most 100 characters.');
    } else {
      sanitized.group_name = data.group_name.trim();
    }
  }

  if (data.monthly_fee !== undefined || !isUpdate) {
    if (!isValidPositiveAmount(data.monthly_fee)) {
      errors.push('Monthly tuition fee must be a positive number with at most 2 decimal places.');
    } else {
      sanitized.monthly_fee = roundMoney(Number(data.monthly_fee));
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    data: sanitized
  };
}

function validatePaymentInput(data) {
  const errors = [];
  const sanitized = {};

  const studentId = Number(data.student_id);
  if (!Number.isInteger(studentId) || studentId <= 0) {
    errors.push('Valid positive integer student_id is required.');
  } else {
    sanitized.student_id = studentId;
  }

  if (!isValidPositiveAmount(data.amount)) {
    errors.push('Payment amount must be a positive number with at most 2 decimal places.');
  } else {
    sanitized.amount = roundMoney(Number(data.amount));
  }

  if (!data.payment_date || typeof data.payment_date !== 'string') {
    errors.push('Payment date is required in YYYY-MM-DD format.');
  } else {
    const trimmedDate = data.payment_date.trim();
    if (!isValidCalendarDate(trimmedDate)) {
      errors.push('Payment date must be a valid calendar date in YYYY-MM-DD format.');
    } else {
      sanitized.payment_date = trimmedDate;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    data: sanitized
  };
}

module.exports = {
  isValidCalendarDate,
  isValidPositiveAmount,
  validateMonthParam,
  getMonthDateRange,
  validateStudentInput,
  validatePaymentInput
};
