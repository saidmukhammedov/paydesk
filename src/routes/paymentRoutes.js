const express = require('express');
const PaymentService = require('../services/paymentService');
const { BadRequestError } = require('../utils/errors');

function createPaymentRouter(paymentService = new PaymentService()) {
  const router = express.Router();

  router.post('/', async (req, res, next) => {
    try {
      const payment = await paymentService.createPayment(req.body);
      res.status(201).json(payment);
    } catch (err) {
      next(err);
    }
  });

  router.get('/', async (req, res, next) => {
    try {
      const studentId = req.query.student_id;
      if (!studentId) {
        throw new BadRequestError('Query parameter "student_id" is required to fetch payments.');
      }
      const payments = await paymentService.getStudentPayments(studentId);
      res.json(payments);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = createPaymentRouter;
