/* istanbul ignore file */
const pool = require('../src/Infrastructures/database/postgres/pool');

const CommentsTableTestHelper = {
  async addComment({
    id = 'comment-123',
    content = 'sebuah comment',
    threadId = 'thread-123',
    thread_id = threadId,
    owner = 'user-123',
    is_delete = false,
    date = new Date().toISOString(),
    created_at = new Date().toISOString(),
    updated_at = new Date().toISOString(),
    likeCount = 0,
    like_count = likeCount,
  }) {
    const query = {
      text: 'INSERT INTO comments (id, thread_id, content, owner, is_delete, date, created_at, updated_at, like_count) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      values: [id, thread_id, content, owner, is_delete, date, created_at, updated_at, like_count],
    };

    await pool.query(query);
  },

  async findCommentsById(id) {
    const query = {
      text: 'SELECT * FROM comments WHERE id = $1',
      values: [id],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async findCommentsByThreadId(threadId) {
    const query = {
      text: 'SELECT * FROM comments WHERE thread_id = $1',
      values: [threadId],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async cleanTable() {
    await pool.query('DELETE FROM comments WHERE 1=1');
  },
};

module.exports = CommentsTableTestHelper;