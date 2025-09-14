const InvariantError = require('../../Commons/exceptions/InvariantError');
const NotFoundError = require('../../Commons/exceptions/NotFoundError');
const LikeRepository = require('../../Domains/likes/LikeRepository');
const Like = require('../../Domains/likes/entities/Like');

class LikeRepositoryPostgres extends LikeRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addLike(newLike) {
    const { commentId, userId } = newLike;
    const id = `like-${this._idGenerator()}`;
    const createdAt = new Date().toISOString();

    const query = {
      text: 'INSERT INTO comment_likes (id, comment_id, user_id, created_at) VALUES($1, $2, $3, $4) RETURNING id, comment_id, user_id, created_at',
      values: [id, commentId, userId, createdAt],
    };

    try {
      const result = await this._pool.query(query);
      const row = result.rows[0];

      return new Like({
        id: row.id,
        commentId: row.comment_id,
        userId: row.user_id,
        createdAt: new Date(row.created_at),
      });
    } catch (error) {
      if (error.code === '23505') { // unique constraint violation
        throw new InvariantError('like sudah ada');
      }
      throw error;
    }
  }

  async deleteLike(commentId, userId) {
    const query = {
      text: 'DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2 RETURNING id',
      values: [commentId, userId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('like tidak ditemukan');
    }
  }

  async verifyLikeExists(commentId, userId) {
    const query = {
      text: 'SELECT id FROM comment_likes WHERE comment_id = $1 AND user_id = $2',
      values: [commentId, userId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('like tidak ditemukan');
    }
  }

  async getLikesByCommentId(commentId) {
    const query = {
      text: `SELECT cl.id, cl.comment_id, cl.user_id, cl.created_at, u.username
             FROM comment_likes cl
             LEFT JOIN users u ON u.id = cl.user_id
             WHERE cl.comment_id = $1
             ORDER BY cl.created_at ASC`,
      values: [commentId],
    };

    const result = await this._pool.query(query);

    return result.rows.map((row) => ({
      id: row.id,
      commentId: row.comment_id,
      userId: row.user_id,
      username: row.username,
      createdAt: row.created_at.toISOString(),
    }));
  }

  async getLikeCount(commentId) {
    const query = {
      text: 'SELECT like_count FROM comments WHERE id = $1',
      values: [commentId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('komentar tidak ditemukan');
    }

    return result.rows[0].like_count;
  }
}

module.exports = LikeRepositoryPostgres;
