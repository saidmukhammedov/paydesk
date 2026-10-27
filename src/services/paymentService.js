const PaymentRepository = require('../repositories/paymentRepository');
const StudentRepository = require('../repositories/studentRepository');
const { validatePaymentInput } = require('../utils/validation');
const { NotFoundError, ValidationError, BadRequestError } = require('../utils/errors');

class PaymentService {
  constructor(
    paymentRepository = new PaymentRepository(),
    studentRepository = new StudentRepository()
  ) {
    this.paymentRepo = paymentRepository;
    this.studentRepo = studentRepository;
  }

  _parseId(id, name = 'ID') {
    const numId = Number(id);
    if (!Number.isInteger(numId) || numId <= 0) {
      throw new BadRequestError(`Invalid ${name}. Must be a positive integer.`);
    }
    return numId;
  }

  async createPayment(data) {
    const validation = validatePaymentInput(data);
    if (!validation.valid) {
      throw new ValidationError(validation.errors.join(' '), validation.errors);
    }

    const { student_id, amount, payment_date } = validation.data;

    const student = await this.studentRepo.findById(student_id);
    if (!student) {
      throw new NotFoundError(`Referenced student with ID ${student_id} does not exist.`);
    }

    const payment = await this.paymentRepo.create({
      student_id,
      amount,
      payment_date
    });

    return payment;
  }

  async getStudentPayments(studentId) {
    const numId = this._parseId(studentId, 'student ID');

    const student = await this.studentRepo.findById(numId);
    if (!student) {
      throw new NotFoundError(`Student with ID ${numId} was not found.`);
    }

    const payments = await this.paymentRepo.findByStudentId(numId);
    return payments;
  }
}

module.exports = PaymentService;
