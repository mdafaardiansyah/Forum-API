const NewThread = require('../../Domains/threads/entities/NewThread');
const AddedThread = require('../../Domains/threads/entities/AddedThread');

class AddThreadUseCase {
  constructor({ threadRepository, userRepository }) {
    this._threadRepository = threadRepository;
    this._userRepository = userRepository;
  }

  async execute(useCasePayload) {
    const newThread = new NewThread(useCasePayload);
    
    // Verify user exists
    await this._userRepository.verifyAvailableUsername(newThread.owner);
    
    return this._threadRepository.addThread(newThread);
  }
}

module.exports = AddThreadUseCase;