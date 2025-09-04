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
            execute: jest.fn().mockRejectedValue(error)
          };
        }
        return {};
      })
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
});
