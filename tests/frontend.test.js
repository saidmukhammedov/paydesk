const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createTestApp } = require('./helpers');

describe('Static Assets & Frontend Serving', () => {
  let testEnv;
  let app;

  beforeEach(() => {
    testEnv = createTestApp();
    app = testEnv.app;
  });

  afterEach(() => {
    testEnv.close();
  });

  it('serves index.html at root route /', async () => {
    const res = await request(app).get('/');
    assert.equal(res.status, 200);
    assert.match(res.headers['content-type'], /text\/html/);
    assert.match(res.text, /Learning Center/);
    assert.match(res.text, /studentSearchInput/);
    assert.match(res.text, /debtorsMonthInput/);
  });

  it('serves styles.css at /css/styles.css', async () => {
    const res = await request(app).get('/css/styles.css');
    assert.equal(res.status, 200);
    assert.match(res.headers['content-type'], /text\/css/);
    assert.match(res.text, /--color-primary/);
  });

  it('serves api.js and app.js at /js/...', async () => {
    const apiRes = await request(app).get('/js/api.js');
    assert.equal(apiRes.status, 200);
    assert.match(apiRes.headers['content-type'], /javascript/);
    assert.match(apiRes.text, /ApiService/);

    const appRes = await request(app).get('/js/app.js');
    assert.equal(appRes.status, 200);
    assert.match(appRes.headers['content-type'], /javascript/);
    assert.match(appRes.text, /loadStudents/);
  });

  it('responds with 200 OK on /health', async () => {
    const res = await request(app).get('/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
  });
});

