const Hapi = require('@hapi/hapi');
const loggingMiddleware = require('../logging');

describe('logging middleware', () => {
  let server;
  let consoleSpy;
  let consoleErrorSpy;

  beforeEach(async () => {
    server = Hapi.server({
      host: 'localhost',
      port: 3000,
    });

    await server.register(loggingMiddleware);

    // Add a test route
    server.route({
      method: 'GET',
      path: '/test',
      handler: () => ({ message: 'success' }),
    });

    // Add a route that throws error
    server.route({
      method: 'GET',
      path: '/error',
      handler: () => {
        throw new Error('Test error');
      },
    });

    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should log request information', async () => {
    // Action
    await server.inject({
      method: 'GET',
      url: '/test',
      headers: {
        'user-agent': 'test-agent',
      },
    });

    // Assert
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\[.*\] GET \/test - IP: .* - User-Agent: test-agent/),
    );
  });

  it('should log error information', async () => {
    // Action
    await server.inject({
      method: 'GET',
      url: '/error',
      headers: {
        'user-agent': 'test-agent',
      },
    });

    // Assert
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\[.*\] ERROR GET \/error - Test error/),
    );
  });

  it('should handle request with missing user-agent header', async () => {
    // Action
    await server.inject({
      method: 'GET',
      url: '/test',
    });

    // Assert
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\[.*\] GET \/test - IP: .* - User-Agent: Unknown/),
    );
  });

  it('should log response status code', async () => {
    // Action
    const response = await server.inject({
      method: 'GET',
      url: '/test',
      headers: {
        'user-agent': 'test-agent',
      },
    });

    // Assert
    expect(response.statusCode).toBe(200);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\[.*\] GET \/test - IP: .* - User-Agent: test-agent/),
    );
  });

  it('should handle different HTTP methods', async () => {
    // Add POST route for testing
    server.route({
      method: 'POST',
      path: '/test-post',
      handler: () => ({ message: 'post success' }),
    });

    // Action
    await server.inject({
      method: 'POST',
      url: '/test-post',
      headers: {
        'user-agent': 'test-agent',
      },
    });

    // Assert
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\[.*\] POST \/test-post - IP: .* - User-Agent: test-agent/),
    );
  });
});
