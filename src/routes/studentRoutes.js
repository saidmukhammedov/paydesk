const express = require('express');
const StudentService = require('../services/studentService');
const PaymentService = require('../services/paymentService');

function createStudentRouter(studentService = new StudentService(), paymentService = new PaymentService()) {
  const router = express.Router();

  router.get('/', async (req, res, next) => {
    try {
      const students = await studentService.getAllStudents({
        search: req.query.search,
        group: req.query.group
      });
      res.json(students);
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const student = await studentService.getStudentById(req.params.id);
      res.json(student);
    } catch (err) {
      next(err);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      const student = await studentService.createStudent(req.body);
      res.status(201).json(student);
    } catch (err) {
      next(err);
    }
  });

  router.put('/:id', async (req, res, next) => {
    try {
      const updated = await studentService.updateStudent(req.params.id, req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      const result = await studentService.deleteStudent(req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id/payments', async (req, res, next) => {
    try {
      const payments = await paymentService.getStudentPayments(req.params.id);
      res.json(payments);
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/payments', async (req, res, next) => {
    try {
      const paymentData = {
        student_id: req.params.id,
        amount: req.body.amount,
        payment_date: req.body.payment_date
      };
      const payment = await paymentService.createPayment(paymentData);
      res.status(201).json(payment);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = createStudentRouter;

