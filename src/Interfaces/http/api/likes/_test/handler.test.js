const LikesHandler = require('../handler');
const ToggleLikeUseCase = require('../../../../../Applications/use_case/ToggleLikeUseCase');

describe('LikesHandler', () => {
  describe('putLikeHandler', () => {
    it('should response 200 and call toggleLikeUseCase correctly', async () => {
      // Arrange
      const mockToggleLikeUseCase = new ToggleLikeUseCase({});
      mockToggleLikeUseCase.execute = jest.fn(() => Promise.resolve());

      const mockContainer = {
        getInstance: jest.fn(() => mockToggleLikeUseCase),
      };

      const likesHandler = new LikesHandler(mockContainer);

      const request = {
        auth: {
          credentials: {
            id: 'user-123',
          },
        },
        params: {
          threadId: 'thread-123',
          commentId: 'comment-123',
        },
      };

      const h = {
        response: jest.fn(() => ({
          code: jest.fn(),
        })),
      };

      // Action
      await likesHandler.putLikeHandler(request, h);

      // Assert
      expect(mockContainer.getInstance).toHaveBeenCalledWith(ToggleLikeUseCase.name);
      expect(mockToggleLikeUseCase.execute).toHaveBeenCalledWith({
        threadId: 'thread-123',
        commentId: 'comment-123',
        userId: 'user-123',
      });
      expect(h.response).toHaveBeenCalledWith({
        status: 'success',
      });
    });
  });
});
