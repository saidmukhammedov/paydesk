const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createTestApp } = require('./helpers');

describe('Payments API & History', () => {
  let testEnv;
  let app;
  let sampleStudent;

  beforeEach(async () => {
    testEnv = createTestApp();
    app = testEnv.app;

    const studentRes = await request(app)
      .post('/students')
      .send({
        full_name: 'Payment Test Student',
        phone_number: '+1 555-444-3322',
        group_name: 'Fin-101',
        monthly_fee: 150.00
      });
    sampleStudent = studentRes.body;
  });

  afterEach(() => {
    testEnv.close();
  });

  describe('POST /payments - Creation', () => {
    it('records a payment for an existing student', async () => {
      const res = await request(app)
        .post('/payments')
        .send({
          student_id: sampleStudent.id,
          amount: 75.50,
          payment_date: '2026-10-15'
        });

      assert.equal(res.status, 201);
      assert.ok(res.body.id);
      assert.equal(res.body.student_id, sampleStudent.id);
      assert.equal(res.body.amount, 75.50);
      assert.equal(res.body.payment_date, '2026-10-15');
      assert.ok(res.body.created_at);
    });

    it('records a payment using nested route /students/:id/payments', async () => {
      const res = await request(app)
        .post(`/students/${sampleStudent.id}/payments`)
        .send({
          amount: 50.00,
          payment_date: '2026-10-10'
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.student_id, sampleStudent.id);
      assert.equal(res.body.amount, 50.00);
      assert.equal(res.body.payment_date, '2026-10-10');
    });

    it('returns 404 when student ID does not exist', async () => {
      const res = await request(app)
        .post('/payments')
        .send({
          student_id: 99999,
          amount: 100.00,
          payment_date: '2026-10-15'
        });

      assert.equal(res.status, 404);
      assert.match(res.body.error, /does not exist/i);
    });

    it('rejects payment with negative or zero amount', async () => {
      const zeroRes = await request(app)
        .post('/payments')
        .send({
          student_id: sampleStudent.id,
          amount: 0,
          payment_date: '2026-10-15'
        });
      assert.equal(zeroRes.status, 400);

      const negativeRes = await request(app)
        .post('/payments')
        .send({
          student_id: sampleStudent.id,
          amount: -25.00,
          payment_date: '2026-10-15'
        });
      assert.equal(negativeRes.status, 400);
    });

    it('rejects payment with invalid amount precision (> 2 decimal places)', async () => {
      const res = await request(app)
        .post('/payments')
        .send({
          student_id: sampleStudent.id,
          amount: 50.123,
          payment_date: '2026-10-15'
        });
      assert.equal(res.status, 400);
    });

    it('rejects payment with invalid date format or non-calendar date', async () => {
      const badFormat = await request(app)
        .post('/payments')
        .send({
          student_id: sampleStudent.id,
          amount: 50.00,
          payment_date: '15-10-2026'
        });
      assert.equal(badFormat.status, 400);

      const invalidDay = await request(app)
        .post('/payments')
        .send({
          student_id: sampleStudent.id,
          amount: 50.00,
          payment_date: '2026-02-30'
        });
      assert.equal(invalidDay.status, 400);
    });

    it('rejects payment with malformed student_id', async () => {
      const res = await request(app)
        .post('/payments')
        .send({
          student_id: 'not-an-id',
          amount: 50.00,
          payment_date: '2026-10-15'
        });
      assert.equal(res.status, 400);
    });
  });

  describe('GET /students/:id/payments - History', () => {
    it('returns empty list when student has no payments', async () => {
      const res = await request(app).get(`/students/${sampleStudent.id}/payments`);
      assert.equal(res.status, 200);
      assert.deepEqual(res.body, []);
    });

    it('returns payment history sorted descending by payment_date', async () => {
      await request(app).post('/payments').send({
        student_id: sampleStudent.id,
        amount: 30.00,
        payment_date: '2026-10-02'
      });
      await request(app).post('/payments').send({
        student_id: sampleStudent.id,
        amount: 70.00,
        payment_date: '2026-10-20'
      });
      await request(app).post('/payments').send({
        student_id: sampleStudent.id,
        amount: 50.00,
        payment_date: '2026-10-10'
      });

      const res = await request(app).get(`/students/${sampleStudent.id}/payments`);
      assert.equal(res.status, 200);
      assert.equal(res.body.length, 3);
      assert.equal(res.body[0].payment_date, '2026-10-20');
      assert.equal(res.body[1].payment_date, '2026-10-10');
      assert.equal(res.body[2].payment_date, '2026-10-02');
    });

    it('returns 404 for payment history of nonexistent student', async () => {
      const res = await request(app).get('/students/9999/payments');
      assert.equal(res.status, 404);
    });

    it('returns payment history via /payments?student_id=', async () => {
      await request(app).post('/payments').send({
        student_id: sampleStudent.id,
        amount: 45.00,
        payment_date: '2026-10-05'
      });

      const res = await request(app).get(`/payments?student_id=${sampleStudent.id}`);
      assert.equal(res.status, 200);
      assert.equal(res.body.length, 1);
      assert.equal(res.body[0].amount, 45.00);
    });
  });

  describe('Database Cascading Integrity on Deletion', () => {
    it('automatically cascades deletion of student to payment records', async () => {
      await request(app).post('/payments').send({
        student_id: sampleStudent.id,
        amount: 50.00,
        payment_date: '2026-10-05'
      });
      await request(app).post('/payments').send({
        student_id: sampleStudent.id,
        amount: 50.00,
        payment_date: '2026-10-15'
      });

      const paymentsBefore = await testEnv.paymentRepo.findByStudentId(sampleStudent.id);
      assert.equal(paymentsBefore.length, 2);

      const deleteRes = await request(app).delete(`/students/${sampleStudent.id}`);
      assert.equal(deleteRes.status, 200);

      const studentAfter = await testEnv.studentRepo.findById(sampleStudent.id);
      assert.equal(studentAfter, null);

      const paymentsAfter = await testEnv.paymentRepo.findByStudentId(sampleStudent.id);
      assert.equal(paymentsAfter.length, 0);
    });
  });
});

