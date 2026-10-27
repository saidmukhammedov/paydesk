const { createDatabase } = require('../src/db/database');
const StudentRepository = require('../src/repositories/studentRepository');
const PaymentRepository = require('../src/repositories/paymentRepository');
const StudentService = require('../src/services/studentService');
const PaymentService = require('../src/services/paymentService');
const DebtorService = require('../src/services/debtorService');
const { createApp } = require('../src/app');

function createTestApp() {
  const db = createDatabase(':memory:');
  const studentRepo = new StudentRepository(db);
  const paymentRepo = new PaymentRepository(db);

  const studentService = new StudentService(studentRepo);
  const paymentService = new PaymentService(paymentRepo, studentRepo);
  const debtorService = new DebtorService(paymentRepo);

  const app = createApp({
    studentService,
    paymentService,
    debtorService
  });

  return {
    app,
    db,
    studentRepo,
    paymentRepo,
    studentService,
    paymentService,
    debtorService,
    close: () => db.close()
  };
}

module.exports = {
  createTestApp
};
