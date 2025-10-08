const NewLike = require('../../Domains/likes/entities/NewLike');

class ToggleLikeUseCase {
  constructor({
    likeRepository, commentRepository, userRepository, threadRepository,
  }) {
    this._likeRepository = likeRepository;
    this._commentRepository = commentRepository;
    this._userRepository = userRepository;
    this._threadRepository = threadRepository;
  }

  async execute(useCasePayload) {
    const { threadId, commentId, userId } = useCasePayload;

    // Verify thread exists
    await this._threadRepository.verifyThreadExists(threadId);

    // Verify comment exists
    await this._commentRepository.verifyCommentExists(commentId);

    // Verify comment belongs to the thread
    await this._commentRepository.verifyCommentInThread(commentId, threadId);

    // Verify user exists
    await this._userRepository.verifyUserExists(userId);

    try {
      // Check if like already exists
      await this._likeRepository.verifyLikeExists(commentId, userId);

      // If like exists, remove it (unlike)
      await this._likeRepository.deleteLike(commentId, userId);

      return {
        status: 'success',
        message: 'Like removed successfully',
      };
    } catch (error) {
      // If like doesn't exist, add it
      const newLike = new NewLike({ commentId, userId });
      await this._likeRepository.addLike(newLike);

      return {
        status: 'success',
        message: 'Like added successfully',
      };
    }
  }
}

module.exports = ToggleLikeUseCase;
