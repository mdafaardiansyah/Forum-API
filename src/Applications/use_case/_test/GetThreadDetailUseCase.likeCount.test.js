const GetThreadDetailUseCase = require('../GetThreadDetailUseCase');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const CommentRepository = require('../../../Domains/comments/CommentRepository');
const ReplyRepository = require('../../../Domains/replies/ReplyRepository');

describe('GetThreadDetailUseCase - with like count', () => {
  it('should orchestrating the get thread detail action correctly with like count', async () => {
    // Arrange
    const useCasePayload = {
      threadId: 'thread-123',
    };

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
        content: 'sebuah comment',
        date: '2021-08-08T07:19:09.775Z',
        username: 'dicoding',
        is_delete: false,
      },
      {
        id: 'comment-456',
        content: 'sebuah comment lagi',
        date: '2021-08-08T07:20:09.775Z',
        username: 'johndoe',
        is_delete: false,
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
    mockCommentRepository.getLikeCountByCommentId = jest.fn()
      .mockImplementation((commentId) => {
        if (commentId === 'comment-123') return Promise.resolve(5);
        if (commentId === 'comment-456') return Promise.resolve(2);
        return Promise.resolve(0);
      });
    mockReplyRepository.getRepliesByCommentId = jest.fn()
      .mockImplementation((commentId) => {
        if (commentId === 'comment-123') return Promise.resolve(expectedReplies);
        return Promise.resolve([]);
      });

    /** creating use case instance */
    const getThreadDetailUseCase = new GetThreadDetailUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository,
    });

    // Action
    const detailThread = await getThreadDetailUseCase.execute(useCasePayload);

    // Assert
    expect(detailThread).toMatchObject({
      id: 'thread-123',
      title: 'sebuah thread',
      body: 'sebuah body thread',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
      comments: [
        {
          id: 'comment-123',
          content: 'sebuah comment',
          date: '2021-08-08T07:19:09.775Z',
          username: 'dicoding',
          likeCount: 5,
          replies: [
            {
              id: 'reply-123',
              content: 'sebuah reply',
              date: '2021-08-08T07:21:09.775Z',
              username: 'dicoding',
            },
          ],
        },
        {
          id: 'comment-456',
          content: 'sebuah comment lagi',
          date: '2021-08-08T07:20:09.775Z',
          username: 'johndoe',
          likeCount: 2,
          replies: [],
        },
      ],
    });
    expect(mockThreadRepository.verifyThreadExists).toBeCalledWith(useCasePayload.threadId);
    expect(mockThreadRepository.getDetailThreadById).toBeCalledWith(useCasePayload.threadId);
    expect(mockCommentRepository.getCommentsByThreadId).toBeCalledWith(useCasePayload.threadId);
    expect(mockCommentRepository.getLikeCountByCommentId).toBeCalledWith('comment-123');
    expect(mockCommentRepository.getLikeCountByCommentId).toBeCalledWith('comment-456');
    expect(mockReplyRepository.getRepliesByCommentId).toBeCalledWith('comment-123');
    expect(mockReplyRepository.getRepliesByCommentId).toBeCalledWith('comment-456');
  });
});
