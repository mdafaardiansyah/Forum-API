const Comment = require('../Comment');

describe('a Comment entities', () => {
  it('should throw error when payload did not contain needed property', () => {
    // Arrange
    const payload = {
      id: 'comment-123',
      content: 'sebuah comment',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
    };

    // Action and Assert
    expect(() => new Comment(payload)).toThrowError('COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload did not meet data type specification', () => {
    // Arrange
    const payload = {
      id: 123,
      content: 'sebuah comment',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
      isDelete: false,
    };

    // Action and Assert
    expect(() => new Comment(payload)).toThrowError('COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create comment object correctly when isDelete is false', () => {
    // Arrange
    const payload = {
      id: 'comment-123',
      content: 'sebuah comment',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
      isDelete: false,
      replies: [],
    };

    // Action
    const comment = new Comment(payload);

    // Assert
    expect(comment.id).toEqual(payload.id);
    expect(comment.content).toEqual(payload.content);
    expect(comment.date).toEqual(payload.date);
    expect(comment.username).toEqual(payload.username);
    expect(comment.replies).toEqual(payload.replies);
  });

  it('should create comment object correctly when isDelete is true', () => {
    // Arrange
    const payload = {
      id: 'comment-123',
      content: 'sebuah comment',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
      isDelete: true,
    };

    // Action
    const comment = new Comment(payload);

    // Assert
    expect(comment.id).toEqual(payload.id);
    expect(comment.content).toEqual('**komentar telah dihapus**');
    expect(comment.date).toEqual(payload.date);
    expect(comment.username).toEqual(payload.username);
    expect(comment.replies).toEqual([]);
  });

  it('should create comment object correctly without replies property', () => {
    // Arrange
    const payload = {
      id: 'comment-123',
      content: 'sebuah comment',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
      isDelete: false,
    };

    // Action
    const comment = new Comment(payload);

    // Assert
    expect(comment.id).toEqual(payload.id);
    expect(comment.content).toEqual(payload.content);
    expect(comment.date).toEqual(payload.date);
    expect(comment.username).toEqual(payload.username);
    expect(comment.replies).toEqual([]);
  });

  it('should throw error when id is missing', () => {
    // Arrange
    const payload = {
      content: 'sebuah comment',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
      isDelete: false,
    };

    // Action and Assert
    expect(() => new Comment(payload)).toThrowError('COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when content is missing', () => {
    // Arrange
    const payload = {
      id: 'comment-123',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
      isDelete: false,
    };

    // Action and Assert
    expect(() => new Comment(payload)).toThrowError('COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when date is missing', () => {
    // Arrange
    const payload = {
      id: 'comment-123',
      content: 'sebuah comment',
      username: 'dicoding',
      isDelete: false,
    };

    // Action and Assert
    expect(() => new Comment(payload)).toThrowError('COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when username is missing', () => {
    // Arrange
    const payload = {
      id: 'comment-123',
      content: 'sebuah comment',
      date: '2021-08-08T07:19:09.775Z',
      isDelete: false,
    };

    // Action and Assert
    expect(() => new Comment(payload)).toThrowError('COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when isDelete is missing', () => {
    // Arrange
    const payload = {
      id: 'comment-123',
      content: 'sebuah comment',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
    };

    // Action and Assert
    expect(() => new Comment(payload)).toThrowError('COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when id is not string', () => {
    // Arrange
    const payload = {
      id: 123,
      content: 'sebuah comment',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
      isDelete: false,
    };

    // Action and Assert
    expect(() => new Comment(payload)).toThrowError('COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should throw error when content is not string', () => {
    // Arrange
    const payload = {
      id: 'comment-123',
      content: 123,
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
      isDelete: false,
    };

    // Action and Assert
    expect(() => new Comment(payload)).toThrowError('COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should throw error when date is not string', () => {
    // Arrange
    const payload = {
      id: 'comment-123',
      content: 'sebuah comment',
      date: 123,
      username: 'dicoding',
      isDelete: false,
    };

    // Action and Assert
    expect(() => new Comment(payload)).toThrowError('COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should throw error when username is not string', () => {
    // Arrange
    const payload = {
      id: 'comment-123',
      content: 'sebuah comment',
      date: '2021-08-08T07:19:09.775Z',
      username: 123,
      isDelete: false,
    };

    // Action and Assert
    expect(() => new Comment(payload)).toThrowError('COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should throw error when isDelete is not boolean', () => {
    // Arrange
    const payload = {
      id: 'comment-123',
      content: 'sebuah comment',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
      isDelete: 'false',
    };

    // Action and Assert
    expect(() => new Comment(payload)).toThrowError('COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });
});