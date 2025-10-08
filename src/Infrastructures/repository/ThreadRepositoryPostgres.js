const NotFoundError = require('../../Commons/exceptions/NotFoundError');
const ThreadRepository = require('../../Domains/threads/ThreadRepository');
const AddedThread = require('../../Domains/threads/entities/AddedThread');

class ThreadRepositoryPostgres extends ThreadRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addThread(newThread) {
    const { title, body, owner } = newThread;
    const id = `thread-${this._idGenerator()}`;
    const date = new Date().toISOString();

    const query = {
      text: 'INSERT INTO threads VALUES($1, $2, $3, $4, $5) RETURNING id, title, owner',
      values: [id, title, body, owner, date],
    };

    const result = await this._pool.query(query);

    return new AddedThread({ ...result.rows[0] });
  }

  async getThreadById(threadId) {
    const query = {
      text: `SELECT t.id, t.title, t.body, t.date, u.username 
             FROM threads t 
             LEFT JOIN users u ON u.id = t.owner 
             WHERE t.id = $1`,
      values: [threadId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('thread tidak ditemukan');
    }

    const thread = result.rows[0];
    return {
      ...thread,
      date: thread.date.toISOString(),
    };
  }

  async verifyThreadExists(threadId) {
    const query = {
      text: 'SELECT id FROM threads WHERE id = $1',
      values: [threadId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('thread tidak ditemukan');
    }
  }

  async getThreadsWithComments() {
    const query = {
      text: `SELECT t.id, t.title, t.body, t.date, u.username 
             FROM threads t 
             LEFT JOIN users u ON u.id = t.owner 
             ORDER BY t.date DESC`,
    };

    const result = await this._pool.query(query);
    return result.rows;
  }

  async getDetailThreadById(threadId) {
    const query = {
      text: `SELECT t.id, t.title, t.body, t.date, u.username 
             FROM threads t 
             LEFT JOIN users u ON u.id = t.owner 
             WHERE t.id = $1`,
      values: [threadId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('thread tidak ditemukan');
    }

    const thread = result.rows[0];
    return {
      ...thread,
      date: thread.date.toISOString(),
    };
  }
}

module.exports = ThreadRepositoryPostgres;
