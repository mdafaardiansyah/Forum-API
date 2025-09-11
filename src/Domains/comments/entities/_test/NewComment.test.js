const NewComment = require('../NewComment');

describe('a NewComment entities', () => {
  it('should throw error when payload did not contain needed property', () => {
    // Arrange
    const payload = {
      content: 'sebuah comment',
      threadId: 'thread-123',
    };

    // Action and Assert
    expect(() => new NewComment(payload)).toThrowError('NEW_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload did not meet data type specification', () => {
    // Arrange
    const payload = {
      content: 123,
      threadId: 'thread-123',
      owner: 'user-123',
    };

    // Action and Assert
    expect(() => new NewComment(payload)).toThrowError('NEW_COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should throw error when content is empty', () => {
    // Arrange
    const payload = {
      content: '   ',
      threadId: 'thread-123',
      owner: 'user-123',
    };

    // Action and Assert
    expect(() => new NewComment(payload)).toThrowError('NEW_COMMENT.EMPTY_CONTENT');
  });

  it('should create newComment object correctly', () => {
    // Arrange
    const payload = {
      content: 'sebuah comment',
      threadId: 'thread-123',
      owner: 'user-123',
    };

    // Action
    const newComment = new NewComment(payload);

    // Assert
    expect(newComment.content).toEqual(payload.content);
    expect(newComment.threadId).toEqual(payload.threadId);
    expect(newComment.owner).toEqual(payload.owner);
  });

  it('should throw error when content is missing', () => {
    // Arrange
    const payload = {
      threadId: 'thread-123',
      owner: 'user-123',
    };

    // Action and Assert
    expect(() => new NewComment(payload)).toThrowError('NEW_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when threadId is missing', () => {
    // Arrange
    const payload = {
      content: 'sebuah comment',
      owner: 'user-123',
    };

    // Action and Assert
    expect(() => new NewComment(payload)).toThrowError('NEW_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when owner is missing', () => {
    // Arrange
    const payload = {
      content: 'sebuah comment',
      threadId: 'thread-123',
    };

    // Action and Assert
    expect(() => new NewComment(payload)).toThrowError('NEW_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when content is not string', () => {
    // Arrange
    const payload = {
      content: 123,
      threadId: 'thread-123',
      owner: 'user-123',
    };

    // Action and Assert
    expect(() => new NewComment(payload)).toThrowError('NEW_COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should throw error when threadId is not string', () => {
    // Arrange
    const payload = {
      content: 'sebuah comment',
      threadId: 123,
      owner: 'user-123',
    };

    // Action and Assert
    expect(() => new NewComment(payload)).toThrowError('NEW_COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should throw error when owner is not string', () => {
    // Arrange
    const payload = {
      content: 'sebuah comment',
      threadId: 'thread-123',
      owner: 123,
    };

    // Action and Assert
    expect(() => new NewComment(payload)).toThrowError('NEW_COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should throw error when content is empty string', () => {
    // Arrange
    const payload = {
      content: '',
      threadId: 'thread-123',
      owner: 'user-123',
    };

    // Action and Assert
    expect(() => new NewComment(payload)).toThrowError('NEW_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
  });
});
