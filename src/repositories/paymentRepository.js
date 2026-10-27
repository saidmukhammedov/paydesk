const { getDatabase } = require('../db/database');
const { isPostgresConfigured, getPool, initPostgresSchema } = require('../db/postgres');
const { roundMoney } = require('../utils/money');

class PaymentRepository {
  constructor(db = null) {
    this._db = db;
  }

  get isPostgres() {
    if (this._db) return false;
    return isPostgresConfigured();
  }

  get sqliteDb() {
    return this._db || getDatabase();
  }

  async _ensurePostgres() {
    await initPostgresSchema();
    return getPool();
  }

  async create({ student_id, amount, payment_date }) {
    if (this.isPostgres) {
      const pool = await this._ensurePostgres();
      const sql = `
        INSERT INTO payments (student_id, amount, payment_date)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      const result = await pool.query(sql, [student_id, amount, payment_date]);
      const row = result.rows[0];
      return {
        ...row,
        amount: roundMoney(row.amount)
      };
    }

    const stmt = this.sqliteDb.prepare(`
      INSERT INTO payments (student_id, amount, payment_date)
      VALUES (?, ?, ?)
    `);
    const info = stmt.run(student_id, amount, payment_date);
    return this.findById(info.lastInsertRowid);
  }

  async findById(id) {
    if (this.isPostgres) {
      const pool = await this._ensurePostgres();
      const result = await pool.query('SELECT * FROM payments WHERE id = $1', [id]);
      const row = result.rows[0];
      if (!row) return null;
      return {
        ...row,
        amount: roundMoney(row.amount)
      };
    }

    const stmt = this.sqliteDb.prepare('SELECT * FROM payments WHERE id = ?');
    const row = stmt.get(id);
    if (!row) return null;
    return {
      ...row,
      amount: roundMoney(row.amount)
    };
  }

  async findByStudentId(studentId) {
    if (this.isPostgres) {
      const pool = await this._ensurePostgres();
      const sql = `
        SELECT * FROM payments
        WHERE student_id = $1
        ORDER BY payment_date DESC, id DESC
      `;
      const result = await pool.query(sql, [studentId]);
      return result.rows.map(r => ({
        ...r,
        amount: roundMoney(r.amount)
      }));
    }

    const stmt = this.sqliteDb.prepare(`
      SELECT * FROM payments
      WHERE student_id = ?
      ORDER BY payment_date DESC, id DESC
    `);
    const rows = stmt.all(studentId);
    return rows.map(r => ({
      ...r,
      amount: roundMoney(r.amount)
    }));
  }

  async getMonthlyAggregation(startDate, endDate) {
    if (this.isPostgres) {
      const pool = await this._ensurePostgres();
      const sql = `
        SELECT
          s.id,
          s.full_name,
          s.phone_number,
          s.group_name,
          s.monthly_fee,
          COALESCE(SUM(p.amount), 0) AS total_paid
        FROM students s
        LEFT JOIN payments p
          ON s.id = p.student_id
          AND p.payment_date >= $1
          AND p.payment_date <= $2
        GROUP BY s.id, s.full_name, s.phone_number, s.group_name, s.monthly_fee
        ORDER BY s.full_name ASC
      `;
      const result = await pool.query(sql, [startDate, endDate]);
      return result.rows.map(r => ({
        id: r.id,
        full_name: r.full_name,
        phone_number: r.phone_number,
        group_name: r.group_name,
        monthly_fee: roundMoney(r.monthly_fee),
        total_paid: roundMoney(r.total_paid)
      }));
    }

    const stmt = this.sqliteDb.prepare(`
      SELECT
        s.id,
        s.full_name,
        s.phone_number,
        s.group_name,
        s.monthly_fee,
        COALESCE(SUM(p.amount), 0) AS total_paid
      FROM students s
      LEFT JOIN payments p
        ON s.id = p.student_id
        AND p.payment_date >= ?
        AND p.payment_date <= ?
      GROUP BY s.id
      ORDER BY s.full_name COLLATE NOCASE ASC
    `);
    const rows = stmt.all(startDate, endDate);
    return rows.map(r => ({
      id: r.id,
      full_name: r.full_name,
      phone_number: r.phone_number,
      group_name: r.group_name,
      monthly_fee: roundMoney(r.monthly_fee),
      total_paid: roundMoney(r.total_paid)
    }));
  }
}

module.exports = PaymentRepository;
