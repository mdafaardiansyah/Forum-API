const NewComment = require('../../Domains/comments/entities/NewComment');

class AddCommentUseCase {
  constructor({ commentRepository, threadRepository, userRepository }) {
    this._commentRepository = commentRepository;
    this._threadRepository = threadRepository;
    this._userRepository = userRepository;
  }

  async execute(useCasePayload) {
    const newComment = new NewComment(useCasePayload);

    // Verify thread exists
    await this._threadRepository.verifyThreadExists(newComment.threadId);

    // Verify user exists
    await this._userRepository.verifyUserExists(newComment.owner);

    return this._commentRepository.addComment(newComment);
  }
}

module.exports = AddCommentUseCase;
