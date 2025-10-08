const pool = require('../../database/postgres/pool');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const AuthenticationsTableTestHelper = require('../../../../tests/AuthenticationsTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const container = require('../../container');
const createServer = require('../createServer');

describe('/security', () => {
  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await AuthenticationsTableTestHelper.cleanTable();
  });

  describe('Security Headers', () => {
    it('should include security headers in successful responses', async () => {
      // Arrange
      const server = await createServer(container);

      // Add user first
      await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: 'dicoding',
          password: 'secret',
          fullname: 'Dicoding Indonesia',
        },
      });

      // Action - Login to get a successful response
      const response = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'dicoding',
          password: 'secret',
        },
      });

      // Assert
      expect(response.statusCode).toEqual(201);
      expect(response.headers['x-content-type-options']).toEqual('nosniff');
      expect(response.headers['x-frame-options']).toEqual('DENY');
      expect(response.headers['x-xss-protection']).toEqual('1; mode=block');
      expect(response.headers['strict-transport-security']).toEqual('max-age=31536000; includeSubDomains');
      expect(response.headers['referrer-policy']).toEqual('strict-origin-when-cross-origin');
      expect(response.headers['content-security-policy']).toEqual("default-src 'self'");
    });

    it('should include security headers in error responses', async () => {
      // Arrange
      const server = await createServer(container);

      // Action
      const response = await server.inject({
        method: 'GET',
        url: '/nonexistent-endpoint',
      });

      // Assert
      expect(response.statusCode).toEqual(404);
      expect(response.headers['x-content-type-options']).toEqual('nosniff');
      expect(response.headers['x-frame-options']).toEqual('DENY');
      expect(response.headers['x-xss-protection']).toEqual('1; mode=block');
      expect(response.headers['strict-transport-security']).toEqual('max-age=31536000; includeSubDomains');
      expect(response.headers['referrer-policy']).toEqual('strict-origin-when-cross-origin');
      expect(response.headers['content-security-policy']).toEqual("default-src 'self'");
    });
  });

  describe('HTTPS Enforcement', () => {
    it('should not redirect in development environment', async () => {
      // Arrange
      const server = await createServer(container);
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      // Add user first
      await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: 'dicoding',
          password: 'secret',
          fullname: 'Dicoding Indonesia',
        },
      });

      // Action
      const response = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'dicoding',
          password: 'secret',
        },
        headers: {
          'x-forwarded-proto': 'http',
        },
      });

      // Assert
      expect(response.statusCode).toEqual(201);

      // Cleanup
      process.env.NODE_ENV = originalEnv;
    });

    it('should redirect to HTTPS in production environment', async () => {
      // Arrange
      const server = await createServer(container);
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      // Action
      const response = await server.inject({
        method: 'GET',
        url: '/',
        headers: {
          'x-forwarded-proto': 'http',
          host: 'example.com',
        },
      });

      // Assert
      expect(response.statusCode).toEqual(301);
      expect(response.headers.location).toEqual('https://example.com/');

      // Cleanup
      process.env.NODE_ENV = originalEnv;
    });

    it('should not redirect when already using HTTPS in production', async () => {
      // Arrange
      const server = await createServer(container);
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      // Action
      const response = await server.inject({
        method: 'GET',
        url: '/',
        headers: {
          'x-forwarded-proto': 'https',
          host: 'example.com',
        },
      });

      // Assert
      expect(response.statusCode).toEqual(200);

      // Cleanup
      process.env.NODE_ENV = originalEnv;
    });
  });
});
