const NewLike = require('../NewLike');

describe('a NewLike entities', () => {
  it('should throw error when payload did not contain needed property', () => {
    // Arrange
    const payload = {
      commentId: 'comment-123',
    };

    // Action and Assert
    expect(() => new NewLike(payload)).toThrowError('NEW_LIKE.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload did not meet data type specification', () => {
    // Arrange
    const payload = {
      commentId: 123,
      userId: 'user-123',
    };

    // Action and Assert
    expect(() => new NewLike(payload)).toThrowError('NEW_LIKE.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create newLike object correctly', () => {
    // Arrange
    const payload = {
      commentId: 'comment-123',
      userId: 'user-123',
    };

    // Action
    const { commentId, userId } = new NewLike(payload);

    // Assert
    expect(commentId).toEqual(payload.commentId);
    expect(userId).toEqual(payload.userId);
  });
});
