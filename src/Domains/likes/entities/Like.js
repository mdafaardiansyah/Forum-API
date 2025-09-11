class Like {
  constructor(payload) {
    this._verifyPayload(payload);

    const {
      id, commentId, userId, createdAt,
    } = payload;

    this.id = id;
    this.commentId = commentId;
    this.userId = userId;
    this.createdAt = createdAt;
  }

  _verifyPayload({
    id, commentId, userId, createdAt,
  }) {
    if (!id || !commentId || !userId || !createdAt) {
      throw new Error('LIKE.NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (typeof id !== 'string' || typeof commentId !== 'string' || typeof userId !== 'string') {
      throw new Error('LIKE.NOT_MEET_DATA_TYPE_SPECIFICATION');
    }

    if (!(createdAt instanceof Date)) {
      throw new Error('LIKE.NOT_MEET_DATA_TYPE_SPECIFICATION');
    }
  }
}

module.exports = Like;
