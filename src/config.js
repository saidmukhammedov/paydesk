const path = require('node:path');

const isTest = process.env.NODE_ENV === 'test';
const defaultDbPath = isTest
  ? ':memory:'
  : path.join(__dirname, '..', 'data', 'learning_center.db');

module.exports = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  DB_PATH: process.env.DB_PATH || defaultDbPath,
  NODE_ENV: process.env.NODE_ENV || 'development'
};

