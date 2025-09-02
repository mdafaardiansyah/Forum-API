const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const CommentRepository = require('../../../Domains/comments/CommentRepository');
const ReplyRepository = require('../../../Domains/replies/ReplyRepository');
const GetThreadDetailUseCase = require('../GetThreadDetailUseCase');
const DetailThread = require('../../../Domains/threads/entities/DetailThread');
const Comment = require('../../../Domains/comments/entities/Comment');
const Reply = require('../../../Domains/replies/entities/Reply');

describe('GetThreadDetailUseCase', () => {
  it('should orchestrating the get thread detail action correctly', async () => {
    // Arrange
    const threadId = 'thread-123';
    const expectedThread = {
      id: 'thread-123',
      title: 'sebuah thread',
      body: 'sebuah body thread',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
    };
    const expectedComments = [
      {
        id: 'comment-123',
        username: 'dicoding',
        date: '2021-08-08T07:19:09.775Z',
        content: 'sebuah comment',
        is_delete: false,
      },
      {
        id: 'comment-456',
        username: 'johndoe',
        date: '2021-08-08T07:20:09.775Z',
        content: 'sebuah comment lagi',
        is_delete: true,
      },
    ];
    const expectedReplies = [
      {
        id: 'reply-123',
        content: 'sebuah reply',
        date: '2021-08-08T07:21:09.775Z',
        username: 'dicoding',
        is_delete: false,
      },
    ];

    /** creating dependency of use case */
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockReplyRepository = new ReplyRepository();

    /** mocking needed function */
    mockThreadRepository.verifyThreadExists = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockThreadRepository.getDetailThreadById = jest.fn()
      .mockImplementation(() => Promise.resolve(expectedThread));
    mockCommentRepository.getCommentsByThreadId = jest.fn()
      .mockImplementation(() => Promise.resolve(expectedComments));
    mockReplyRepository.getRepliesByCommentId = jest.fn()
      .mockImplementation(() => Promise.resolve(expectedReplies));

    /** creating use case instance */
    const getThreadDetailUseCase = new GetThreadDetailUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository,
    });

    // Action
    const thread = await getThreadDetailUseCase.execute({ threadId });

    // Assert
    expect(thread).toStrictEqual(new DetailThread({
      id: 'thread-123',
      title: 'sebuah thread',
      body: 'sebuah body thread',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
      comments: [
        new Comment({
          id: 'comment-123',
          username: 'dicoding',
          date: '2021-08-08T07:19:09.775Z',
          content: 'sebuah comment',
          isDelete: false,
          replies: [
            new Reply({
              id: 'reply-123',
              content: 'sebuah reply',
              date: '2021-08-08T07:21:09.775Z',
              username: 'dicoding',
              isDelete: false,
            }),
          ],
        }),
        new Comment({
          id: 'comment-456',
          username: 'johndoe',
          date: '2021-08-08T07:20:09.775Z',
          content: '**komentar telah dihapus**',
          isDelete: true,
          replies: [
            new Reply({
              id: 'reply-123',
              content: 'sebuah reply',
              date: '2021-08-08T07:21:09.775Z',
              username: 'dicoding',
              isDelete: false,
            }),
          ],
        }),
      ],
    }));
    expect(mockThreadRepository.verifyThreadExists).toBeCalledWith(threadId);
    expect(mockThreadRepository.getDetailThreadById).toBeCalledWith(threadId);
    expect(mockCommentRepository.getCommentsByThreadId).toBeCalledWith(threadId);
    expect(mockReplyRepository.getRepliesByCommentId).toBeCalledWith('comment-123');
    expect(mockReplyRepository.getRepliesByCommentId).toBeCalledWith('comment-456');
  });

  it('should handle thread with no comments', async () => {
    // Arrange
    const threadId = 'thread-123';
    const expectedThread = {
      id: 'thread-123',
      title: 'sebuah thread',
      body: 'sebuah body thread',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
    };

    /** creating dependency of use case */
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockReplyRepository = new ReplyRepository();

    /** mocking needed function */
    mockThreadRepository.verifyThreadExists = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockThreadRepository.getDetailThreadById = jest.fn()
      .mockImplementation(() => Promise.resolve(expectedThread));
    mockCommentRepository.getCommentsByThreadId = jest.fn()
      .mockImplementation(() => Promise.resolve([]));

    /** creating use case instance */
    const getThreadDetailUseCase = new GetThreadDetailUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository,
    });

    // Action
    const thread = await getThreadDetailUseCase.execute({ threadId });

    // Assert
    expect(thread).toStrictEqual(new DetailThread({
      id: 'thread-123',
      title: 'sebuah thread',
      body: 'sebuah body thread',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
      comments: [],
    }));
    expect(mockThreadRepository.verifyThreadExists).toBeCalledWith(threadId);
    expect(mockThreadRepository.getDetailThreadById).toBeCalledWith(threadId);
    expect(mockCommentRepository.getCommentsByThreadId).toBeCalledWith(threadId);
  });
});