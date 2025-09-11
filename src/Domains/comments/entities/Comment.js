class Comment {
  constructor(payload) {
    this._verifyPayload(payload);

    const {
      id, content, date, username, isDelete, replies, likeCount,
    } = payload;

    this.id = id;
    this.content = isDelete ? '**komentar telah dihapus**' : content;
    this.date = date;
    this.username = username;
    this.replies = replies || [];
    this.likeCount = likeCount || 0;
  }

  _verifyPayload({
    id, content, date, username, isDelete, likeCount,
  }) {
    if (!id || !content || !date || !username || isDelete === undefined) {
      throw new Error('COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (typeof id !== 'string' || typeof content !== 'string' || typeof date !== 'string' || typeof username !== 'string' || typeof isDelete !== 'boolean') {
      throw new Error('COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
    }

    if (likeCount !== undefined && typeof likeCount !== 'number') {
      throw new Error('COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
    }
  }
}

module.exports = Comment;
