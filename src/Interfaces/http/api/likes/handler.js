const ToggleLikeUseCase = require('../../../../Applications/use_case/ToggleLikeUseCase');

class LikesHandler {
  constructor(container) {
    this._container = container;

    this.putLikeHandler = this.putLikeHandler.bind(this);
  }

  async putLikeHandler(request, h) {
    const { id: credentialId } = request.auth.credentials;
    const { threadId, commentId } = request.params;
    const toggleLikeUseCase = this._container.getInstance(ToggleLikeUseCase.name);

    await toggleLikeUseCase.execute({
      threadId,
      commentId,
      userId: credentialId,
    });

    const response = h.response({
      status: 'success',
    });
    return response;
  }
}

module.exports = LikesHandler;
