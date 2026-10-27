const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createTestApp } = require('./helpers');

describe('Monthly Debtors Calculation (/debtors?month=YYYY-MM)', () => {
  let testEnv;
  let app;

  beforeEach(() => {
    testEnv = createTestApp();
    app = testEnv.app;
  });

  afterEach(() => {
    testEnv.close();
  });

  describe('Validation of month parameter', () => {
    it('returns 400 when month parameter is missing', async () => {
      const res = await request(app).get('/debtors');
      assert.equal(res.status, 400);
      assert.match(res.body.error, /parameter "month" is required/i);
    });

    it('returns 400 when month parameter is empty string', async () => {
      const res = await request(app).get('/debtors?month=');
      assert.equal(res.status, 400);
      assert.match(res.body.error, /parameter "month" is required/i);
    });

    it('returns 400 for malformed month string', async () => {
      const testCases = [
        '2026-1',
        '2026-13',
        '2026-00',
        '2026/10',
        'October-2026',
        '1899-12',
        '2105-01'
      ];

      for (const invalidMonth of testCases) {
        const res = await request(app).get(`/debtors?month=${invalidMonth}`);
        assert.equal(res.status, 400, `Expected 400 for month="${invalidMonth}"`);
      }
    });

    it('accepts valid month format YYYY-MM', async () => {
      const res = await request(app).get('/debtors?month=2026-10');
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body));
    });
  });

  describe('Debtor Calculation Scenarios', () => {
    it('scenario: student with NO payments appears with full debt', async () => {
      const studentRes = await request(app).post('/students').send({
        full_name: 'No Pay Student',
        phone_number: '+1 555-000-1111',
        group_name: 'Alpha',
        monthly_fee: 120.00
      });
      const studentId = studentRes.body.id;

      const res = await request(app).get('/debtors?month=2026-10');
      assert.equal(res.status, 200);
      assert.equal(res.body.length, 1);

      const debtor = res.body[0];
      assert.equal(debtor.id, studentId);
      assert.equal(debtor.full_name, 'No Pay Student');
      assert.equal(debtor.phone_number, '+1 555-000-1111');
      assert.equal(debtor.group_name, 'Alpha');
      assert.equal(debtor.monthly_fee, 120.00);
      assert.equal(debtor.total_paid, 0.00);
      assert.equal(debtor.debt, 120.00);
    });

    it('scenario: student with partial payment appears with remaining debt', async () => {
      const studentRes = await request(app).post('/students').send({
        full_name: 'Partial Pay Student',
        phone_number: '+1 555-000-2222',
        group_name: 'Alpha',
        monthly_fee: 100.00
      });
      const studentId = studentRes.body.id;

      await request(app).post('/payments').send({
        student_id: studentId,
        amount: 40.00,
        payment_date: '2026-10-10'
      });

      const res = await request(app).get('/debtors?month=2026-10');
      assert.equal(res.status, 200);
      assert.equal(res.body.length, 1);

      const debtor = res.body[0];
      assert.equal(debtor.id, studentId);
      assert.equal(debtor.monthly_fee, 100.00);
      assert.equal(debtor.total_paid, 40.00);
      assert.equal(debtor.debt, 60.00);
    });

    it('scenario: student with EXACT payment does NOT appear in debtors list', async () => {
      const studentRes = await request(app).post('/students').send({
        full_name: 'Exact Pay Student',
        phone_number: '+1 555-000-3333',
        group_name: 'Beta',
        monthly_fee: 150.00
      });
      const studentId = studentRes.body.id;

      await request(app).post('/payments').send({
        student_id: studentId,
        amount: 150.00,
        payment_date: '2026-10-05'
      });

      const res = await request(app).get('/debtors?month=2026-10');
      assert.equal(res.status, 200);
      assert.equal(res.body.length, 0);
    });

    it('scenario: student who OVERPAID does NOT appear in debtors list', async () => {
      const studentRes = await request(app).post('/students').send({
        full_name: 'Overpayer Student',
        phone_number: '+1 555-000-4444',
        group_name: 'Beta',
        monthly_fee: 100.00
      });
      const studentId = studentRes.body.id;

      await request(app).post('/payments').send({
        student_id: studentId,
        amount: 135.00,
        payment_date: '2026-10-05'
      });

      const res = await request(app).get('/debtors?month=2026-10');
      assert.equal(res.status, 200);
      assert.equal(res.body.length, 0);
    });

    it('scenario: multiple payments in the same month must be summed', async () => {
      const studentRes = await request(app).post('/students').send({
        full_name: 'Installment Student',
        phone_number: '+1 555-000-5555',
        group_name: 'Gamma',
        monthly_fee: 200.00
      });
      const studentId = studentRes.body.id;

      await request(app).post('/payments').send({
        student_id: studentId,
        amount: 50.00,
        payment_date: '2026-10-02'
      });
      await request(app).post('/payments').send({
        student_id: studentId,
        amount: 60.00,
        payment_date: '2026-10-14'
      });

      const res = await request(app).get('/debtors?month=2026-10');
      assert.equal(res.status, 200);
      assert.equal(res.body.length, 1);
      assert.equal(res.body[0].total_paid, 110.00);
      assert.equal(res.body[0].debt, 90.00);

      await request(app).post('/payments').send({
        student_id: studentId,
        amount: 90.00,
        payment_date: '2026-10-25'
      });

      const updatedRes = await request(app).get('/debtors?month=2026-10');
      assert.equal(updatedRes.status, 200);
      assert.equal(updatedRes.body.length, 0);
    });

    it('scenario: payments across different months must NOT affect requested month', async () => {
      const studentRes = await request(app).post('/students').send({
        full_name: 'Multi-Month Student',
        phone_number: '+1 555-000-6666',
        group_name: 'Delta',
        monthly_fee: 100.00
      });
      const studentId = studentRes.body.id;

      await request(app).post('/payments').send({
        student_id: studentId,
        amount: 100.00,
        payment_date: '2026-09-20'
      });

      await request(app).post('/payments').send({
        student_id: studentId,
        amount: 100.00,
        payment_date: '2026-11-05'
      });

      const sepRes = await request(app).get('/debtors?month=2026-09');
      assert.equal(sepRes.status, 200);
      assert.equal(sepRes.body.length, 0);

      const octRes = await request(app).get('/debtors?month=2026-10');
      assert.equal(octRes.status, 200);
      assert.equal(octRes.body.length, 1);
      assert.equal(octRes.body[0].id, studentId);
      assert.equal(octRes.body[0].total_paid, 0.00);
      assert.equal(octRes.body[0].debt, 100.00);

      const novRes = await request(app).get('/debtors?month=2026-11');
      assert.equal(novRes.status, 200);
      assert.equal(novRes.body.length, 0);
    });

    it('handles mixed cohort of paid, partial, and unpaid students simultaneously', async () => {
      await request(app).post('/students').send({
        full_name: 'Student Unpaid',
        phone_number: '+1 555-001-0001',
        group_name: 'Cohort A',
        monthly_fee: 100.00
      });

      const partialRes = await request(app).post('/students').send({
        full_name: 'Student Partial',
        phone_number: '+1 555-001-0002',
        group_name: 'Cohort A',
        monthly_fee: 100.00
      });
      await request(app).post('/payments').send({
        student_id: partialRes.body.id,
        amount: 60.00,
        payment_date: '2026-10-08'
      });

      const exactRes = await request(app).post('/students').send({
        full_name: 'Student Exact',
        phone_number: '+1 555-001-0003',
        group_name: 'Cohort B',
        monthly_fee: 100.00
      });
      await request(app).post('/payments').send({
        student_id: exactRes.body.id,
        amount: 100.00,
        payment_date: '2026-10-08'
      });

      const overRes = await request(app).post('/students').send({
        full_name: 'Student Over',
        phone_number: '+1 555-001-0004',
        group_name: 'Cohort B',
        monthly_fee: 100.00
      });
      await request(app).post('/payments').send({
        student_id: overRes.body.id,
        amount: 150.00,
        payment_date: '2026-10-08'
      });

      const res = await request(app).get('/debtors?month=2026-10');
      assert.equal(res.status, 200);

      assert.equal(res.body.length, 2);

      const names = res.body.map(d => d.full_name);
      assert.ok(names.includes('Student Unpaid'));
      assert.ok(names.includes('Student Partial'));
      assert.ok(!names.includes('Student Exact'));
      assert.ok(!names.includes('Student Over'));
    });
  });
});
