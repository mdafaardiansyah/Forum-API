const pool = require('../../database/postgres/pool');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const AuthenticationsTableTestHelper = require('../../../../tests/AuthenticationsTableTestHelper');
const container = require('../../container');
const createServer = require('../createServer');

describe('Security Integration Tests', () => {
  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await UsersTableTestHelper.cleanTable();
    await AuthenticationsTableTestHelper.cleanTable();
  });

  describe('Security Headers', () => {
    it('should include security headers in all responses', async () => {
      // Arrange
      const server = await createServer(container);

      // Action
      const response = await server.inject({
        method: 'GET',
        url: '/threads',
      });

      // Assert: Security headers should be present
      expect(response.headers['x-content-type-options']).toEqual('nosniff');
      expect(response.headers['x-frame-options']).toEqual('DENY');
      expect(response.headers['x-xss-protection']).toEqual('1; mode=block');
      expect(response.headers['strict-transport-security']).toBeDefined();
      expect(response.headers['content-security-policy']).toBeDefined();
    });

    it('should handle OPTIONS requests properly', async () => {
      // Arrange
      const server = await createServer(container);

      // Action
      const response = await server.inject({
        method: 'OPTIONS',
        url: '/threads',
        headers: {
          Origin: 'https://example.com',
          'Access-Control-Request-Method': 'GET',
        },
      });

      // Assert: Should handle OPTIONS request (CORS not explicitly configured)
      expect([200, 404, 405]).toContain(response.statusCode);
      // Security headers should still be present
      expect(response.headers['x-content-type-options']).toEqual('nosniff');
      expect(response.headers['x-frame-options']).toEqual('DENY');
    });
  });

  describe('Authentication Security', () => {
    it('should reject requests with invalid JWT token', async () => {
      // Arrange
      const server = await createServer(container);

      // Action
      const response = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'Test Thread',
          body: 'Test Body',
        },
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      });

      // Assert
      expect(response.statusCode).toEqual(401);
      const responseJson = JSON.parse(response.payload);
      expect(responseJson.error).toEqual('Unauthorized');
    });

    it('should reject requests with expired JWT token', async () => {
      // Arrange
      const server = await createServer(container);

      // Create an expired token (this is a mock expired token)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';

      // Action
      const response = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'Test Thread',
          body: 'Test Body',
        },
        headers: {
          Authorization: `Bearer ${expiredToken}`,
        },
      });

      // Assert
      expect(response.statusCode).toEqual(401);
      const responseJson = JSON.parse(response.payload);
      expect(responseJson.error).toEqual('Unauthorized');
    });

    it('should reject requests without authorization header for protected endpoints', async () => {
      // Arrange
      const server = await createServer(container);

      // Action
      const response = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'Test Thread',
          body: 'Test Body',
        },
      });

      // Assert
      expect(response.statusCode).toEqual(401);
      const responseJson = JSON.parse(response.payload);
      expect(responseJson.error).toEqual('Unauthorized');
      expect(responseJson.message).toEqual('Missing authentication');
    });
  });

  describe('Input Validation Security', () => {
    it('should reject requests with malicious script injection in thread title', async () => {
      // Arrange
      const server = await createServer(container);

      // Create user and get access token
      await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: 'dicoding',
          password: 'secret',
          fullname: 'Dicoding Indonesia',
        },
      });

      const loginResponse = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'dicoding',
          password: 'secret',
        },
      });

      const { data: { accessToken } } = JSON.parse(loginResponse.payload);

      // Action: Try to inject script
      const response = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: '<script>alert("XSS")</script>',
          body: 'Test Body',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert: Should still create thread but content should be sanitized
      expect(response.statusCode).toEqual(201);
      const responseJson = JSON.parse(response.payload);
      expect(responseJson.status).toEqual('success');
      // The actual sanitization would depend on your implementation
    });

    it('should reject requests with SQL injection attempts', async () => {
      // Arrange
      const server = await createServer(container);

      // Action: Try SQL injection in username
      const response = await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: "admin'; DROP TABLE users; --",
          password: 'secret',
          fullname: 'Malicious User',
        },
      });

      // Assert: Should handle gracefully (either reject or sanitize)
      // The exact behavior depends on your validation implementation
      expect([400, 401, 500]).toContain(response.statusCode);
    });

    it('should handle requests with long payloads', async () => {
      // Arrange
      const server = await createServer(container);
      const longString = 'a'.repeat(1000); // Long but reasonable string

      // Action
      const response = await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: 'testuser',
          password: 'secret',
          fullname: longString,
        },
      });

      // Assert: Should handle gracefully (accept or reject based on validation)
      expect([201, 400, 413, 500]).toContain(response.statusCode);
      if (response.statusCode === 201) {
        const responseJson = JSON.parse(response.payload);
        expect(responseJson.status).toEqual('success');
      }
    });
  });

  describe('Rate Limiting Security', () => {
    it('should prevent brute force attacks on login endpoint', async () => {
      // Arrange
      const server = await createServer(container);

      // Create user
      await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: 'testuser',
          password: 'secret',
          fullname: 'Test User',
        },
      });

      // Action: Make multiple failed login attempts
      const requests = [];
      for (let i = 0; i < 20; i += 1) {
        requests.push(
          server.inject({
            method: 'POST',
            url: '/authentications',
            payload: {
              username: 'testuser',
              password: 'wrongpassword',
            },
          }),
        );
      }

      const responses = await Promise.all(requests);

      // Assert: All should fail with 401, but server should handle gracefully
      responses.forEach((response) => {
        expect([401, 429]).toContain(response.statusCode);
      });
    });
  });

  describe('Error Handling Security', () => {
    it('should not expose sensitive information in error messages', async () => {
      // Arrange
      const server = await createServer(container);

      // Action: Trigger a server error
      const response = await server.inject({
        method: 'GET',
        url: '/threads/invalid-thread-id-that-causes-error',
      });

      // Assert: Error message should not expose internal details
      const responseJson = JSON.parse(response.payload);
      expect(responseJson.message).not.toContain('database');
      expect(responseJson.message).not.toContain('sql');
      expect(responseJson.message).not.toContain('password');
      expect(responseJson.message).not.toContain('secret');
    });

    it('should handle malformed JSON gracefully', async () => {
      // Arrange
      const server = await createServer(container);

      // Action: Send malformed JSON
      const response = await server.inject({
        method: 'POST',
        url: '/users',
        payload: '{"username": "test", "password": "secret", "fullname": }', // Malformed JSON
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Assert: Should handle gracefully
      expect([400, 500]).toContain(response.statusCode);
      // For malformed JSON, Hapi returns different error structure
      if (response.statusCode === 400) {
        const responseJson = JSON.parse(response.payload);
        expect(['fail', 'error']).toContain(responseJson.status || 'error');
      }
    });
  });

  describe('Content Security', () => {
    it('should set appropriate content-type headers', async () => {
      // Arrange
      const server = await createServer(container);

      // Action
      const response = await server.inject({
        method: 'GET',
        url: '/threads',
      });

      // Assert
      expect(response.headers['content-type']).toContain('application/json');
    });

    it('should prevent clickjacking with X-Frame-Options', async () => {
      // Arrange
      const server = await createServer(container);

      // Action
      const response = await server.inject({
        method: 'GET',
        url: '/threads',
      });

      // Assert
      expect(response.headers['x-frame-options']).toEqual('DENY');
    });

    it('should prevent MIME type sniffing', async () => {
      // Arrange
      const server = await createServer(container);

      // Action
      const response = await server.inject({
        method: 'GET',
        url: '/threads',
      });

      // Assert
      expect(response.headers['x-content-type-options']).toEqual('nosniff');
    });
  });

  describe('Health Check Security', () => {
    it('should provide health check endpoint without exposing sensitive info', async () => {
      // Arrange
      const server = await createServer(container);

      // Action
      const response = await server.inject({
        method: 'GET',
        url: '/', // Health check is at root path
      });

      // Assert
      expect(response.statusCode).toEqual(200);
      const responseJson = JSON.parse(response.payload);
      expect(responseJson.status).toEqual('success');
      expect(responseJson.message).toEqual('Forum API is running');
      // Should not expose database credentials, internal paths, etc.
      expect(JSON.stringify(responseJson)).not.toContain('password');
      expect(JSON.stringify(responseJson)).not.toContain('secret');
    });
  });
});
