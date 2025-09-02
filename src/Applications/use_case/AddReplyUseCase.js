const NewReply = require('../../Domains/replies/entities/NewReply');
const AddedReply = require('../../Domains/replies/entities/AddedReply');

class AddReplyUseCase {
  constructor({ replyRepository, commentRepository, threadRepository, userRepository }) {
    this._replyRepository = replyRepository;
    this._commentRepository = commentRepository;
    this._threadRepository = threadRepository;
    this._userRepository = userRepository;
  }

  async execute(useCasePayload) {
    const newReply = new NewReply(useCasePayload);
    
    // Verify thread exists
    await this._threadRepository.verifyThreadExists(useCasePayload.threadId);
    
    // Verify comment exists
    await this._commentRepository.verifyCommentExists(newReply.commentId);
    
    // Verify user exists
    await this._userRepository.verifyUserExists(newReply.owner);
    
    return this._replyRepository.addReply(newReply);
  }
}

module.exports = AddReplyUseCase;