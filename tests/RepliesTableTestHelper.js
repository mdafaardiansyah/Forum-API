/* istanbul ignore file */
const pool = require('../src/Infrastructures/database/postgres/pool');

const RepliesTableTestHelper = {
  async addReply({
    id = 'reply-123',
    content = 'sebuah reply',
    comment_id = 'comment-123',
    owner = 'user-123',
    is_delete = false,
    date = new Date().toISOString(),
    created_at = new Date().toISOString(),
    updated_at = new Date().toISOString(),
  }) {
    const query = {
      text: 'INSERT INTO replies (id, comment_id, content, owner, is_delete, date, created_at, updated_at) VALUES($1, $2, $3, $4, $5, $6, $7, $8)',
      values: [id, comment_id, content, owner, is_delete, date, created_at, updated_at],
    };

    await pool.query(query);
  },

  async findRepliesById(id) {
    const query = {
      text: 'SELECT * FROM replies WHERE id = $1',
      values: [id],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async findRepliesByCommentId(commentId) {
    const query = {
      text: 'SELECT * FROM replies WHERE comment_id = $1',
      values: [commentId],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async cleanTable() {
    await pool.query('DELETE FROM replies WHERE 1=1');
  },
};

module.exports = RepliesTableTestHelper;