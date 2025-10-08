const Reply = require('../Reply');

describe('a Reply entities', () => {
  it('should throw error when payload did not contain needed property', () => {
    // Arrange
    const payload = {
      id: 'reply-123',
      content: 'sebuah reply',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
    };

    // Action and Assert
    expect(() => new Reply(payload)).toThrowError('REPLY.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload did not meet data type specification', () => {
    // Arrange
    const payload = {
      id: 123,
      content: 'sebuah reply',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
      isDelete: false,
    };

    // Action and Assert
    expect(() => new Reply(payload)).toThrowError('REPLY.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create reply object correctly when isDelete is false', () => {
    // Arrange
    const payload = {
      id: 'reply-123',
      content: 'sebuah reply',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
      isDelete: false,
    };

    // Action
    const reply = new Reply(payload);

    // Assert
    expect(reply.id).toEqual(payload.id);
    expect(reply.content).toEqual(payload.content);
    expect(reply.date).toEqual(payload.date);
    expect(reply.username).toEqual(payload.username);
  });

  it('should create reply object correctly when isDelete is true', () => {
    // Arrange
    const payload = {
      id: 'reply-123',
      content: 'sebuah reply',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
      isDelete: true,
    };

    // Action
    const reply = new Reply(payload);

    // Assert
    expect(reply.id).toEqual(payload.id);
    expect(reply.content).toEqual('**balasan telah dihapus**');
    expect(reply.date).toEqual(payload.date);
    expect(reply.username).toEqual(payload.username);
  });

  it('should throw error when id is missing', () => {
    // Arrange
    const payload = {
      content: 'sebuah reply',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
      isDelete: false,
    };

    // Action and Assert
    expect(() => new Reply(payload)).toThrowError('REPLY.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when content is missing', () => {
    // Arrange
    const payload = {
      id: 'reply-123',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
      isDelete: false,
    };

    // Action and Assert
    expect(() => new Reply(payload)).toThrowError('REPLY.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when date is missing', () => {
    // Arrange
    const payload = {
      id: 'reply-123',
      content: 'sebuah reply',
      username: 'dicoding',
      isDelete: false,
    };

    // Action and Assert
    expect(() => new Reply(payload)).toThrowError('REPLY.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when username is missing', () => {
    // Arrange
    const payload = {
      id: 'reply-123',
      content: 'sebuah reply',
      date: '2021-08-08T07:19:09.775Z',
      isDelete: false,
    };

    // Action and Assert
    expect(() => new Reply(payload)).toThrowError('REPLY.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when isDelete is missing', () => {
    // Arrange
    const payload = {
      id: 'reply-123',
      content: 'sebuah reply',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
    };

    // Action and Assert
    expect(() => new Reply(payload)).toThrowError('REPLY.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when id is not string', () => {
    // Arrange
    const payload = {
      id: 123,
      content: 'sebuah reply',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
      isDelete: false,
    };

    // Action and Assert
    expect(() => new Reply(payload)).toThrowError('REPLY.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should throw error when content is not string', () => {
    // Arrange
    const payload = {
      id: 'reply-123',
      content: 123,
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
      isDelete: false,
    };

    // Action and Assert
    expect(() => new Reply(payload)).toThrowError('REPLY.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should throw error when date is not string', () => {
    // Arrange
    const payload = {
      id: 'reply-123',
      content: 'sebuah reply',
      date: 123,
      username: 'dicoding',
      isDelete: false,
    };

    // Action and Assert
    expect(() => new Reply(payload)).toThrowError('REPLY.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should throw error when username is not string', () => {
    // Arrange
    const payload = {
      id: 'reply-123',
      content: 'sebuah reply',
      date: '2021-08-08T07:19:09.775Z',
      username: 123,
      isDelete: false,
    };

    // Action and Assert
    expect(() => new Reply(payload)).toThrowError('REPLY.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should throw error when isDelete is not boolean', () => {
    // Arrange
    const payload = {
      id: 'reply-123',
      content: 'sebuah reply',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
      isDelete: 'false',
    };

    // Action and Assert
    expect(() => new Reply(payload)).toThrowError('REPLY.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });
});
