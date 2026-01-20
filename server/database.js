import Database from 'better-sqlite3';
import dotenv from 'dotenv';

dotenv.config();

const db = new Database(process.env.DATABASE_PATH || './database.db');

// Initialize database tables
export function initializeDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tickets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'OPEN',
      priority TEXT DEFAULT 'MEDIUM',
      creator_id INTEGER NOT NULL,
      assignee_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creator_id) REFERENCES users(id),
      FOREIGN KEY (assignee_id) REFERENCES users(id)
    )
  `);

  // Comments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  console.log('✅ Database initialized successfully');
}

// User operations
export const userDb = {
  create: (email, password, name, role = 'user') => {
    const stmt = db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)');
    const result = stmt.run(email, password, name, role);
    return result.lastInsertRowid;
  },

  findByEmail: (email) => {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
  },

  findById: (id) => {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  },

  getAll: () => {
    const stmt = db.prepare('SELECT id, email, name, role, created_at FROM users');
    return stmt.all();
  }
};

// Ticket operations
export const ticketDb = {
  create: (title, description, status, priority, creatorId, assigneeId = null) => {
    const stmt = db.prepare(
      'INSERT INTO tickets (title, description, status, priority, creator_id, assignee_id) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const result = stmt.run(title, description, status, priority, creatorId, assigneeId);
    return result.lastInsertRowid;
  },

  findById: (id) => {
    const stmt = db.prepare('SELECT * FROM tickets WHERE id = ?');
    return stmt.get(id);
  },

  getAll: (filters = {}) => {
    let query = 'SELECT * FROM tickets WHERE 1=1';
    const params = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.priority) {
      query += ' AND priority = ?';
      params.push(filters.priority);
    }

    if (filters.assigneeId) {
      query += ' AND assignee_id = ?';
      params.push(filters.assigneeId);
    }

    if (filters.creatorId) {
      query += ' AND creator_id = ?';
      params.push(filters.creatorId);
    }

    query += ' ORDER BY created_at DESC';

    const stmt = db.prepare(query);
    return stmt.all(...params);
  },

  update: (id, updates) => {
    const fields = [];
    const values = [];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.priority !== undefined) {
      fields.push('priority = ?');
      values.push(updates.priority);
    }
    if (updates.assigneeId !== undefined) {
      fields.push('assignee_id = ?');
      values.push(updates.assigneeId);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`UPDATE tickets SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
    return ticketDb.findById(id);
  },

  delete: (id) => {
    const stmt = db.prepare('DELETE FROM tickets WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  search: (searchTerm) => {
    const stmt = db.prepare(
      'SELECT * FROM tickets WHERE title LIKE ? OR description LIKE ? ORDER BY created_at DESC'
    );
    const term = `%${searchTerm}%`;
    return stmt.all(term, term);
  }
};

// Comment operations
export const commentDb = {
  create: (ticketId, userId, content) => {
    const stmt = db.prepare('INSERT INTO comments (ticket_id, user_id, content) VALUES (?, ?, ?)');
    const result = stmt.run(ticketId, userId, content);
    return result.lastInsertRowid;
  },

  findById: (id) => {
    const stmt = db.prepare('SELECT * FROM comments WHERE id = ?');
    return stmt.get(id);
  },

  getByTicketId: (ticketId) => {
    const stmt = db.prepare('SELECT * FROM comments WHERE ticket_id = ? ORDER BY created_at ASC');
    return stmt.all(ticketId);
  },

  delete: (id) => {
    const stmt = db.prepare('DELETE FROM comments WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
};

export default db;
