const { getDatabase } = require('../db/database');
const { isPostgresConfigured, getPool, initPostgresSchema } = require('../db/postgres');
const { roundMoney } = require('../utils/money');

class StudentRepository {
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

  async findAll({ search, group } = {}) {
    if (this.isPostgres) {
      const pool = await this._ensurePostgres();
      let sql = 'SELECT * FROM students WHERE 1=1';
      const params = [];

      if (group && typeof group === 'string' && group.trim()) {
        params.push(group.trim());
        sql += ` AND group_name = $${params.length}`;
      }

      if (search && typeof search === 'string' && search.trim()) {
        params.push(`%${search.trim()}%`);
        sql += ` AND (full_name ILIKE $${params.length} OR phone_number ILIKE $${params.length})`;
      }

      sql += ' ORDER BY full_name ASC';
      const result = await pool.query(sql, params);
      return result.rows.map(r => ({
        ...r,
        monthly_fee: roundMoney(r.monthly_fee)
      }));
    }

    let sql = 'SELECT * FROM students WHERE 1=1';
    const params = [];

    if (group && typeof group === 'string' && group.trim()) {
      sql += ' AND group_name = ?';
      params.push(group.trim());
    }

    if (search && typeof search === 'string' && search.trim()) {
      sql += ' AND (full_name LIKE ? OR phone_number LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    sql += ' ORDER BY full_name COLLATE NOCASE ASC';
    const stmt = this.sqliteDb.prepare(sql);
    const rows = stmt.all(...params);
    return rows.map(r => ({
      ...r,
      monthly_fee: roundMoney(r.monthly_fee)
    }));
  }

  async findById(id) {
    if (this.isPostgres) {
      const pool = await this._ensurePostgres();
      const result = await pool.query('SELECT * FROM students WHERE id = $1', [id]);
      const row = result.rows[0];
      if (!row) return null;
      return {
        ...row,
        monthly_fee: roundMoney(row.monthly_fee)
      };
    }

    const stmt = this.sqliteDb.prepare('SELECT * FROM students WHERE id = ?');
    const row = stmt.get(id);
    if (!row) return null;
    return {
      ...row,
      monthly_fee: roundMoney(row.monthly_fee)
    };
  }

  async create({ full_name, phone_number, group_name, monthly_fee }) {
    if (this.isPostgres) {
      const pool = await this._ensurePostgres();
      const sql = `
        INSERT INTO students (full_name, phone_number, group_name, monthly_fee)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      const result = await pool.query(sql, [full_name, phone_number, group_name, monthly_fee]);
      const row = result.rows[0];
      return {
        ...row,
        monthly_fee: roundMoney(row.monthly_fee)
      };
    }

    const stmt = this.sqliteDb.prepare(`
      INSERT INTO students (full_name, phone_number, group_name, monthly_fee)
      VALUES (?, ?, ?, ?)
    `);
    const info = stmt.run(full_name, phone_number, group_name, monthly_fee);
    return this.findById(info.lastInsertRowid);
  }

  async update(id, { full_name, phone_number, group_name, monthly_fee }) {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updatedName = full_name !== undefined ? full_name : existing.full_name;
    const updatedPhone = phone_number !== undefined ? phone_number : existing.phone_number;
    const updatedGroup = group_name !== undefined ? group_name : existing.group_name;
    const updatedFee = monthly_fee !== undefined ? monthly_fee : existing.monthly_fee;

    if (this.isPostgres) {
      const pool = await this._ensurePostgres();
      const sql = `
        UPDATE students
        SET full_name = $1,
            phone_number = $2,
            group_name = $3,
            monthly_fee = $4,
            updated_at = NOW()
        WHERE id = $5
        RETURNING *
      `;
      const result = await pool.query(sql, [updatedName, updatedPhone, updatedGroup, updatedFee, id]);
      const row = result.rows[0];
      return {
        ...row,
        monthly_fee: roundMoney(row.monthly_fee)
      };
    }

    const stmt = this.sqliteDb.prepare(`
      UPDATE students
      SET full_name = ?,
          phone_number = ?,
          group_name = ?,
          monthly_fee = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `);
    stmt.run(updatedName, updatedPhone, updatedGroup, updatedFee, id);
    return this.findById(id);
  }

  async delete(id) {
    if (this.isPostgres) {
      const pool = await this._ensurePostgres();
      const result = await pool.query('DELETE FROM students WHERE id = $1', [id]);
      return result.rowCount > 0;
    }

    const stmt = this.sqliteDb.prepare('DELETE FROM students WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
}

module.exports = StudentRepository;

