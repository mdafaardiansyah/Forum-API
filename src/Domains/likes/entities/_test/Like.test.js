const Like = require('../Like');

describe('a Like entities', () => {
  it('should throw error when payload did not contain needed property', () => {
    // Arrange
    const payload = {
      id: 'like-123',
      commentId: 'comment-123',
      userId: 'user-123',
    };

    // Action and Assert
    expect(() => new Like(payload)).toThrowError('LIKE.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload did not meet data type specification', () => {
    // Arrange
    const payload = {
      id: 123,
      commentId: 'comment-123',
      userId: 'user-123',
      createdAt: new Date(),
    };

    // Action and Assert
    expect(() => new Like(payload)).toThrowError('LIKE.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should throw error when createdAt is not a Date object', () => {
    // Arrange
    const payload = {
      id: 'like-123',
      commentId: 'comment-123',
      userId: 'user-123',
      createdAt: '2021-08-08T07:19:09.775Z',
    };

    // Action and Assert
    expect(() => new Like(payload)).toThrowError('LIKE.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create like object correctly', () => {
    // Arrange
    const payload = {
      id: 'like-123',
      commentId: 'comment-123',
      userId: 'user-123',
      createdAt: new Date(),
    };

    // Action
    const {
      id, commentId, userId, createdAt,
    } = new Like(payload);

    // Assert
    expect(id).toEqual(payload.id);
    expect(commentId).toEqual(payload.commentId);
    expect(userId).toEqual(payload.userId);
    expect(createdAt).toEqual(payload.createdAt);
  });
});
