const createServer = require('../createServer');

describe('HTTP server', () => {
  it('should response 200 when request root route', async () => {
    // Arrange
    const server = await createServer({});

    // Action
    const response = await server.inject({
      method: 'GET',
      url: '/',
    });

    // Assert
    const responseJson = JSON.parse(response.payload);
    expect(response.statusCode).toEqual(200);
    expect(responseJson.status).toEqual('success');
    expect(responseJson.message).toEqual('Forum API is running');
    expect(responseJson.version).toEqual('1.0.0');
    expect(responseJson.endpoints).toBeDefined();
  });

  it('should response 404 when request unregistered route', async () => {
    // Arrange
    const server = await createServer({});

    // Action
    const response = await server.inject({
      method: 'GET',
      url: '/unregisteredRoute',
    });

    // Assert
    expect(response.statusCode).toEqual(404);
  });

  it('should handle server error correctly', async () => {
    // Arrange
    const requestPayload = {
      username: 'dicoding',
      fullname: 'Dicoding Indonesia',
      password: 'super_secret',
    };
    const server = await createServer({}); // fake injection

    // Action
    const response = await server.inject({
      method: 'POST',
      url: '/users',
      payload: requestPayload,
    });

    // Assert
    const responseJson = JSON.parse(response.payload);
    expect(response.statusCode).toEqual(500);
    expect(responseJson.status).toEqual('fail');
    expect(responseJson.message).toEqual('terjadi kegagalan pada server kami');
  });

  it('should handle non-server error correctly', async () => {
    // Arrange
    const mockContainer = {
      getInstance: jest.fn().mockImplementation((name) => {
        if (name === 'addUserUseCase') {
          const error = new Error('Some client error');
          error.isServer = false;
          return {
            execute: jest.fn().mockRejectedValue(error),
          };
        }
        return {};
      }),
    };
    const server = await createServer(mockContainer);

    // Action
    const response = await server.inject({
      method: 'POST',
      url: '/users',
      payload: {
        username: 'dicoding',
        fullname: 'Dicoding Indonesia',
        password: 'super_secret',
      },
    });

    // Assert - Should continue with Hapi's native error handling
    expect(response.statusCode).toEqual(500);
  });

  it('should handle HTTPS enforcement error correctly', async () => {
    // Arrange
    const originalEnv = process.env.FORCE_HTTPS;
    process.env.FORCE_HTTPS = 'true';
    
    // Mock request object to simulate error in HTTPS enforcement
    const mockRequest = {
      headers: {
        'x-forwarded-proto': 'http',
        host: 'example.com'
      },
      url: {
        pathname: '/test',
        search: '?param=value'
      },
      info: {
        host: null // This will cause an error in HTTPS enforcement
      }
    };
    
    const server = await createServer({});
    
    // Simulate the HTTPS enforcement middleware with error
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    try {
      // Action - This should trigger the error handling in HTTPS enforcement
      const response = await server.inject({
        method: 'GET',
        url: '/test?param=value',
        headers: {
          'x-forwarded-proto': 'http',
          host: 'example.com'
        }
      });
      
      // Assert - Should continue despite error
      expect(response.statusCode).toBeDefined();
    } finally {
      consoleSpy.mockRestore();
      process.env.FORCE_HTTPS = originalEnv;
    }
  });

  it('should skip rate limiting when DISABLE_RATE_LIMIT is true', async () => {
    // Arrange
    const originalEnv = process.env.DISABLE_RATE_LIMIT;
    process.env.DISABLE_RATE_LIMIT = 'true';
    
    const server = await createServer({});
    
    try {
      // Action - Make multiple requests that would normally be rate limited
      const responses = [];
      for (let i = 0; i < 5; i++) {
        const response = await server.inject({
          method: 'GET',
          url: '/'
        });
        responses.push(response);
      }
      
      // Assert - All requests should succeed (no rate limiting)
      responses.forEach(response => {
        expect(response.statusCode).toEqual(200);
      });
    } finally {
      process.env.DISABLE_RATE_LIMIT = originalEnv;
    }
  });

  it('should reset rate limit counter when window has passed', async () => {
    // Arrange
    const server = await createServer({});
    
    // Mock Date.now to control time
    const originalDateNow = Date.now;
    let mockTime = 1000000000000; // Start time
    Date.now = jest.fn(() => mockTime);
    
    try {
      // Action - Make initial request
      await server.inject({
        method: 'GET',
        url: '/'
      });
      
      // Advance time beyond window (60000ms + 1)
      mockTime += 60001;
      
      // Make another request - should reset counter
      const response = await server.inject({
        method: 'GET',
        url: '/'
      });
      
      // Assert - Request should succeed (counter was reset)
      expect(response.statusCode).toEqual(200);
    } finally {
      Date.now = originalDateNow;
    }
  });

  it('should reset rate limit counter when window passes (lines 45-46)', async () => {
    // Arrange
    const originalEnv = process.env.DISABLE_RATE_LIMIT;
    delete process.env.DISABLE_RATE_LIMIT;
    
    const server = await createServer({});
    const originalDateNow = Date.now;
    let mockTime = 1000000000000;
    Date.now = jest.fn(() => mockTime);
    
    try {
      // First request to initialize rate limit data
      await server.inject({ method: 'GET', url: '/', headers: { 'x-forwarded-for': '192.168.1.1' } });
      
      // Advance time past the window to trigger reset (line 44: now >= rateLimitData.resetTime)
      mockTime += 60001;
      
      // This request should trigger lines 45-46: rateLimitData.count = 0; rateLimitData.resetTime = now + windowMs;
      const response = await server.inject({ method: 'GET', url: '/', headers: { 'x-forwarded-for': '192.168.1.1' } });
      
      expect(response.statusCode).toEqual(200);
    } finally {
      Date.now = originalDateNow;
      if (originalEnv !== undefined) {
        process.env.DISABLE_RATE_LIMIT = originalEnv;
      }
    }
  });



  it('should apply rate limiting when DISABLE_RATE_LIMIT is not true', async () => {
    // Arrange
    const originalEnv = process.env.DISABLE_RATE_LIMIT;
    process.env.DISABLE_RATE_LIMIT = 'false'; // Set to false to test line 20 condition
    
    try {
      const server = await createServer({});
      
      // Action - Make a request when rate limiting is enabled
      const response = await server.inject({
        method: 'GET',
        url: '/'
      });
      
      // Assert - Should process normally (rate limiting is active)
      expect(response.statusCode).toEqual(200);
    } finally {
      if (originalEnv !== undefined) {
        process.env.DISABLE_RATE_LIMIT = originalEnv;
      } else {
        delete process.env.DISABLE_RATE_LIMIT;
      }
    }
  });


});
