const HealthHandler = require('../handler');

describe('HealthHandler', () => {
  let healthHandler;
  let mockRequest;
  let mockH;
  let mockResponse;

  beforeEach(() => {
    healthHandler = new HealthHandler();
    mockRequest = {};
    mockResponse = {
      code: jest.fn().mockReturnThis(),
    };
    mockH = {
      response: jest.fn().mockReturnValue(mockResponse),
    };
  });

  describe('getHealthHandler', () => {
    it('should return health status with correct structure', async () => {
      // Arrange
      const originalEnv = process.env.NODE_ENV;
      const originalVersion = process.env.npm_package_version;
      process.env.NODE_ENV = 'test';
      process.env.npm_package_version = '2.0.0';

      // Action
      const result = await healthHandler.getHealthHandler(mockRequest, mockH);

      // Assert
      expect(mockH.response).toHaveBeenCalledWith({
        status: 'success',
        data: {
          health: 'OK',
          timestamp: expect.any(String),
          uptime: expect.any(Number),
          environment: 'test',
          version: '2.0.0',
        },
      });
      expect(mockResponse.code).toHaveBeenCalledWith(200);
      expect(result).toBe(mockResponse);

      // Cleanup
      process.env.NODE_ENV = originalEnv;
      process.env.npm_package_version = originalVersion;
    });

    it('should use default environment when NODE_ENV is not set', async () => {
      // Arrange
      const originalEnv = process.env.NODE_ENV;
      delete process.env.NODE_ENV;

      // Action
      await healthHandler.getHealthHandler(mockRequest, mockH);

      // Assert
      expect(mockH.response).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: expect.objectContaining({
            environment: 'development',
          }),
        })
      );

      // Cleanup
      process.env.NODE_ENV = originalEnv;
    });

    it('should use default version when npm_package_version is not set', async () => {
      // Arrange
      const originalVersion = process.env.npm_package_version;
      delete process.env.npm_package_version;

      // Action
      await healthHandler.getHealthHandler(mockRequest, mockH);

      // Assert
      expect(mockH.response).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: expect.objectContaining({
            version: '1.0.0',
          }),
        })
      );

      // Cleanup
      process.env.npm_package_version = originalVersion;
    });

    it('should return valid ISO timestamp', async () => {
      // Action
      await healthHandler.getHealthHandler(mockRequest, mockH);

      // Assert
      const callArgs = mockH.response.mock.calls[0][0];
      const timestamp = callArgs.data.timestamp;
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
    });

    it('should return positive uptime', async () => {
      // Action
      await healthHandler.getHealthHandler(mockRequest, mockH);

      // Assert
      const callArgs = mockH.response.mock.calls[0][0];
      const uptime = callArgs.data.uptime;
      expect(typeof uptime).toBe('number');
      expect(uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('constructor', () => {
    it('should bind getHealthHandler method', () => {
      // Arrange & Action
      const handler = new HealthHandler();

      // Assert
      expect(handler.getHealthHandler).toBeDefined();
      expect(typeof handler.getHealthHandler).toBe('function');
      
      // Test that the method is properly bound
      const { getHealthHandler } = handler;
      expect(() => getHealthHandler(mockRequest, mockH)).not.toThrow();
    });
  });
});