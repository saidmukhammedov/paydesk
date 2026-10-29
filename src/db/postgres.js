const { Pool } = require('pg');

let pool = null;
let initialized = false;

function getPostgresConnectionString() {
  return process.env.POSTGRES_URL || process.env.DATABASE_URL || null;
}

function isPostgresConfigured() {
  return Boolean(getPostgresConnectionString());
}

function getPool() {
  if (!pool) {
    const connectionString = getPostgresConnectionString();
    if (!connectionString) {
      throw new Error('Postgres connection string (POSTGRES_URL or DATABASE_URL) is not defined.');
    }

    pool = new Pool({
      connectionString,
      ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false }
    });
  }
  return pool;
}

async function initPostgresSchema() {
  if (initialized) return;
  const p = getPool();

  const schema = `
    CREATE TABLE IF NOT EXISTS students (
      id SERIAL PRIMARY KEY,
      full_name TEXT NOT NULL CHECK(length(trim(full_name)) > 0),
      phone_number TEXT NOT NULL CHECK(length(trim(phone_number)) > 0),
      group_name TEXT NOT NULL CHECK(length(trim(group_name)) > 0),
      monthly_fee NUMERIC NOT NULL CHECK(monthly_fee > 0),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      amount NUMERIC NOT NULL CHECK(amount > 0),
      payment_date VARCHAR(10) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
    CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
    CREATE INDEX IF NOT EXISTS idx_students_group_name ON students(group_name);
  `;

  await p.query(schema);
  initialized = true;
}

async function closePostgres() {
  if (pool) {
    await pool.end();
    pool = null;
    initialized = false;
  }
}

module.exports = {
  isPostgresConfigured,
  getPostgresConnectionString,
  getPool,
  initPostgresSchema,
  closePostgres
};

