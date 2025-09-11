const ToggleLikeUseCase = require('../ToggleLikeUseCase');
const LikeRepository = require('../../../Domains/likes/LikeRepository');
const CommentRepository = require('../../../Domains/comments/CommentRepository');
const UserRepository = require('../../../Domains/users/UserRepository');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const NewLike = require('../../../Domains/likes/entities/NewLike');

describe('ToggleLikeUseCase', () => {
  it('should orchestrating the add like action correctly', async () => {
    // Arrange
    const useCasePayload = {
      threadId: 'thread-123',
      commentId: 'comment-123',
      userId: 'user-123',
    };

    const mockLikeRepository = new LikeRepository();
    const mockCommentRepository = new CommentRepository();
    const mockUserRepository = new UserRepository();
    const mockThreadRepository = new ThreadRepository();

    // Mocking
    mockThreadRepository.verifyThreadExists = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyCommentExists = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyCommentInThread = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockUserRepository.verifyUserExists = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockLikeRepository.verifyLikeExists = jest.fn()
      .mockImplementation(() => Promise.reject(new Error('LIKE_NOT_FOUND')));
    mockLikeRepository.addLike = jest.fn()
      .mockImplementation(() => Promise.resolve());

    // Create use case instance
    const toggleLikeUseCase = new ToggleLikeUseCase({
      likeRepository: mockLikeRepository,
      commentRepository: mockCommentRepository,
      userRepository: mockUserRepository,
      threadRepository: mockThreadRepository,
    });

    // Action
    const result = await toggleLikeUseCase.execute(useCasePayload);

    // Assert
    expect(result).toStrictEqual({
      status: 'success',
      message: 'Like added successfully',
    });
    expect(mockThreadRepository.verifyThreadExists).toBeCalledWith('thread-123');
    expect(mockCommentRepository.verifyCommentExists).toBeCalledWith('comment-123');
    expect(mockCommentRepository.verifyCommentInThread).toBeCalledWith('comment-123', 'thread-123');
    expect(mockUserRepository.verifyUserExists).toBeCalledWith('user-123');
    expect(mockLikeRepository.verifyLikeExists).toBeCalledWith('comment-123', 'user-123');
    expect(mockLikeRepository.addLike).toBeCalledWith(new NewLike({
      commentId: 'comment-123',
      userId: 'user-123',
    }));
  });

  it('should orchestrating the remove like action correctly', async () => {
    // Arrange
    const useCasePayload = {
      threadId: 'thread-123',
      commentId: 'comment-123',
      userId: 'user-123',
    };

    const mockLikeRepository = new LikeRepository();
    const mockCommentRepository = new CommentRepository();
    const mockUserRepository = new UserRepository();
    const mockThreadRepository = new ThreadRepository();

    // Mocking
    mockThreadRepository.verifyThreadExists = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyCommentExists = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyCommentInThread = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockUserRepository.verifyUserExists = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockLikeRepository.verifyLikeExists = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockLikeRepository.deleteLike = jest.fn()
      .mockImplementation(() => Promise.resolve());

    // Create use case instance
    const toggleLikeUseCase = new ToggleLikeUseCase({
      likeRepository: mockLikeRepository,
      commentRepository: mockCommentRepository,
      userRepository: mockUserRepository,
      threadRepository: mockThreadRepository,
    });

    // Action
    const result = await toggleLikeUseCase.execute(useCasePayload);

    // Assert
    expect(result).toStrictEqual({
      status: 'success',
      message: 'Like removed successfully',
    });
    expect(mockThreadRepository.verifyThreadExists).toBeCalledWith('thread-123');
    expect(mockCommentRepository.verifyCommentExists).toBeCalledWith('comment-123');
    expect(mockCommentRepository.verifyCommentInThread).toBeCalledWith('comment-123', 'thread-123');
    expect(mockUserRepository.verifyUserExists).toBeCalledWith('user-123');
    expect(mockLikeRepository.verifyLikeExists).toBeCalledWith('comment-123', 'user-123');
    expect(mockLikeRepository.deleteLike).toBeCalledWith('comment-123', 'user-123');
  });
});
