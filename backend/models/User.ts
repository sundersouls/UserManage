import pool from '../db/config';
import bcrypt from 'bcryptjs';

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  is_blocked: boolean;
  last_login: Date;
  created_at: Date;
}

export class UserModel {
  static async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      return result.rows[0] || null;
    } catch (err) {
      console.error('Error querying user by email:', err);
      return null;
    }
  }

  static async findById(id: number): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async getAllUsers(excludeUserId: string): Promise<User[]> {
    const result = await pool.query(
      'SELECT id, name, email, is_blocked, last_login, created_at FROM users WHERE id != $1 ORDER BY last_login DESC',
      [excludeUserId]
    );
    return result.rows;
  }

  static async updateLastLogin(id: number): Promise<void> {
    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [id]);
  }

  static async updateBlockStatus(ids: number[], isBlocked: boolean): Promise<void> {
    const placeholders = ids.map((_, index) => `$${index + 1}`).join(',');
    await pool.query(`UPDATE users SET is_blocked = ${isBlocked} WHERE id IN (${placeholders})`, ids);
  }

  static async deleteUsers(ids: number[]): Promise<void> {
    const placeholders = ids.map((_, index) => `$${index + 1}`).join(',');
    await pool.query(`DELETE FROM users WHERE id IN (${placeholders})`, ids);
  }

  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}