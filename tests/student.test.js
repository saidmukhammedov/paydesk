const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createTestApp } = require('./helpers');

describe('Students API & CRUD Operations', () => {
  let testEnv;
  let app;

  beforeEach(() => {
    testEnv = createTestApp();
    app = testEnv.app;
  });

  afterEach(() => {
    testEnv.close();
  });

  describe('POST /students - Creation', () => {
    it('creates a new student with valid inputs', async () => {
      const res = await request(app)
        .post('/students')
        .send({
          full_name: 'John Doe',
          phone_number: '+1 555-123-4567',
          group_name: 'CS-101',
          monthly_fee: 150.50
        });

      assert.equal(res.status, 201);
      assert.ok(res.body.id);
      assert.equal(res.body.full_name, 'John Doe');
      assert.equal(res.body.phone_number, '+1 555-123-4567');
      assert.equal(res.body.group_name, 'CS-101');
      assert.equal(res.body.monthly_fee, 150.50);
      assert.ok(res.body.created_at);
      assert.ok(res.body.updated_at);
    });

    it('rejects creation when full_name is empty or whitespace', async () => {
      const res = await request(app)
        .post('/students')
        .send({
          full_name: '   ',
          phone_number: '+1 555-123-4567',
          group_name: 'CS-101',
          monthly_fee: 100
        });

      assert.equal(res.status, 400);
      assert.match(res.body.error, /Full name is required/);
    });

    it('rejects creation when phone_number is invalid', async () => {
      const res = await request(app)
        .post('/students')
        .send({
          full_name: 'Jane Smith',
          phone_number: 'abc',
          group_name: 'CS-101',
          monthly_fee: 100
        });

      assert.equal(res.status, 400);
      assert.match(res.body.error, /Phone number format is invalid/);
    });

    it('rejects creation when group_name is missing or empty', async () => {
      const res = await request(app)
        .post('/students')
        .send({
          full_name: 'Jane Smith',
          phone_number: '+1 555-987-6543',
          group_name: '',
          monthly_fee: 100
        });

      assert.equal(res.status, 400);
      assert.match(res.body.error, /Group name is required/);
    });

    it('rejects creation when monthly_fee is zero, negative, or invalid number', async () => {
      const negativeRes = await request(app)
        .post('/students')
        .send({
          full_name: 'Jane Smith',
          phone_number: '+1 555-987-6543',
          group_name: 'CS-101',
          monthly_fee: -50
        });
      assert.equal(negativeRes.status, 400);

      const zeroRes = await request(app)
        .post('/students')
        .send({
          full_name: 'Jane Smith',
          phone_number: '+1 555-987-6543',
          group_name: 'CS-101',
          monthly_fee: 0
        });
      assert.equal(zeroRes.status, 400);

      const nanRes = await request(app)
        .post('/students')
        .send({
          full_name: 'Jane Smith',
          phone_number: '+1 555-987-6543',
          group_name: 'CS-101',
          monthly_fee: 'not-a-number'
        });
      assert.equal(nanRes.status, 400);

      const threeDecimalsRes = await request(app)
        .post('/students')
        .send({
          full_name: 'Jane Smith',
          phone_number: '+1 555-987-6543',
          group_name: 'CS-101',
          monthly_fee: 100.999
        });
      assert.equal(threeDecimalsRes.status, 400);
    });
  });

  describe('GET /students - Listing & Detail', () => {
    it('returns empty array when no students exist', async () => {
      const res = await request(app).get('/students');
      assert.equal(res.status, 200);
      assert.deepEqual(res.body, []);
    });

    it('returns all created students ordered alphabetically', async () => {
      await request(app).post('/students').send({
        full_name: 'Zara Williams',
        phone_number: '+1 555-000-0001',
        group_name: 'Group B',
        monthly_fee: 200
      });
      await request(app).post('/students').send({
        full_name: 'Alice Adams',
        phone_number: '+1 555-000-0002',
        group_name: 'Group A',
        monthly_fee: 150
      });

      const res = await request(app).get('/students');
      assert.equal(res.status, 200);
      assert.equal(res.body.length, 2);
      assert.equal(res.body[0].full_name, 'Alice Adams');
      assert.equal(res.body[1].full_name, 'Zara Williams');
    });

    it('filters students by search query and group', async () => {
      await request(app).post('/students').send({
        full_name: 'Alice Adams',
        phone_number: '+1 555-111-2222',
        group_name: 'Web-A',
        monthly_fee: 100
      });
      await request(app).post('/students').send({
        full_name: 'Bob Brown',
        phone_number: '+1 555-333-4444',
        group_name: 'Web-B',
        monthly_fee: 120
      });

      const searchRes = await request(app).get('/students?search=Alice');
      assert.equal(searchRes.status, 200);
      assert.equal(searchRes.body.length, 1);
      assert.equal(searchRes.body[0].full_name, 'Alice Adams');

      const groupRes = await request(app).get('/students?group=Web-B');
      assert.equal(groupRes.status, 200);
      assert.equal(groupRes.body.length, 1);
      assert.equal(groupRes.body[0].full_name, 'Bob Brown');
    });

    it('retrieves single student by ID', async () => {
      const createRes = await request(app).post('/students').send({
        full_name: 'Charlie Day',
        phone_number: '+1 555-444-5555',
        group_name: 'Web-A',
        monthly_fee: 100
      });
      const id = createRes.body.id;

      const res = await request(app).get(`/students/${id}`);
      assert.equal(res.status, 200);
      assert.equal(res.body.id, id);
      assert.equal(res.body.full_name, 'Charlie Day');
    });

    it('returns 404 for nonexistent student ID', async () => {
      const res = await request(app).get('/students/9999');
      assert.equal(res.status, 404);
      assert.match(res.body.error, /not found/i);
    });

    it('returns 400 for invalid student ID format', async () => {
      const res = await request(app).get('/students/not-an-id');
      assert.equal(res.status, 400);
      assert.match(res.body.error, /invalid student ID/i);
    });
  });

  describe('PUT /students/:id - Update', () => {
    it('updates student details correctly', async () => {
      const createRes = await request(app).post('/students').send({
        full_name: 'Original Name',
        phone_number: '+1 555-111-2222',
        group_name: 'Old Group',
        monthly_fee: 100
      });
      const id = createRes.body.id;

      const updateRes = await request(app)
        .put(`/students/${id}`)
        .send({
          full_name: 'Updated Name',
          phone_number: '+1 555-999-8888',
          group_name: 'New Group',
          monthly_fee: 180.25
        });

      assert.equal(updateRes.status, 200);
      assert.equal(updateRes.body.full_name, 'Updated Name');
      assert.equal(updateRes.body.phone_number, '+1 555-999-8888');
      assert.equal(updateRes.body.group_name, 'New Group');
      assert.equal(updateRes.body.monthly_fee, 180.25);
    });

    it('returns 404 when updating nonexistent student', async () => {
      const res = await request(app)
        .put('/students/9999')
        .send({ full_name: 'Non Existent' });
      assert.equal(res.status, 404);
    });

    it('rejects invalid inputs on update', async () => {
      const createRes = await request(app).post('/students').send({
        full_name: 'Valid Name',
        phone_number: '+1 555-111-2222',
        group_name: 'Group 1',
        monthly_fee: 100
      });
      const id = createRes.body.id;

      const res = await request(app)
        .put(`/students/${id}`)
        .send({ monthly_fee: -10 });
      assert.equal(res.status, 400);
    });
  });

  describe('DELETE /students/:id - Deletion', () => {
    it('deletes student successfully', async () => {
      const createRes = await request(app).post('/students').send({
        full_name: 'To Delete',
        phone_number: '+1 555-111-2222',
        group_name: 'Group 1',
        monthly_fee: 100
      });
      const id = createRes.body.id;

      const deleteRes = await request(app).delete(`/students/${id}`);
      assert.equal(deleteRes.status, 200);
      assert.equal(deleteRes.body.success, true);

      const getRes = await request(app).get(`/students/${id}`);
      assert.equal(getRes.status, 404);
    });

    it('returns 404 when deleting nonexistent student', async () => {
      const res = await request(app).delete('/students/9999');
      assert.equal(res.status, 404);
    });
  });
});

