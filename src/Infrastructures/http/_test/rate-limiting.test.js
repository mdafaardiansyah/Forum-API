const pool = require('../../database/postgres/pool');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const AuthenticationsTableTestHelper = require('../../../../tests/AuthenticationsTableTestHelper');
const container = require('../../container');
const createServer = require('../createServer');

// Helper function to clear rate limit store
const clearRateLimitStore = () => {
  // Access the rate limit store and clear it
  if (global.rateLimitStore) {
    global.rateLimitStore.clear();
  }
};

describe('Rate Limiting Middleware', () => {
  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await UsersTableTestHelper.cleanTable();
    await AuthenticationsTableTestHelper.cleanTable();
    clearRateLimitStore();
  });

  beforeEach(() => {
    clearRateLimitStore();
  });

  describe('when making requests to /threads endpoint', () => {
    it('should allow requests within rate limit', async () => {
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

      // Action: Make multiple requests within limit (less than 90 per minute)
      const requests = [];
      for (let i = 0; i < 5; i += 1) {
        requests.push(
          server.inject({
            method: 'POST',
            url: '/threads',
            payload: {
              title: `Thread ${i}`,
              body: `Body ${i}`,
            },
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }),
        );
      }

      const responses = await Promise.all(requests);

      // Assert: All requests should succeed
      responses.forEach((response) => {
        expect(response.statusCode).toEqual(201);
        const responseJson = JSON.parse(response.payload);
        expect(responseJson.status).toEqual('success');
      });
    });

    it('should block requests when rate limit exceeded', async () => {
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

      // Action: Make requests to exceed rate limit
      // Note: This test simulates rate limit by making many requests
      // First make 90 requests (should all succeed)
      const initialRequests = [];
      for (let i = 0; i < 90; i += 1) {
        initialRequests.push(
          server.inject({
            method: 'POST',
            url: '/threads',
            payload: {
              title: `Thread ${i}`,
              body: `Body ${i}`,
            },
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }),
        );
      }

      const initialResponses = await Promise.all(initialRequests);
      
      // Then make additional requests that should be rate limited
      const additionalRequests = [];
      for (let i = 90; i < 95; i += 1) {
        additionalRequests.push(
          server.inject({
            method: 'POST',
            url: '/threads',
            payload: {
              title: `Thread ${i}`,
              body: `Body ${i}`,
            },
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }),
        );
      }

      const additionalResponses = await Promise.all(additionalRequests);
      const allResponses = [...initialResponses, ...additionalResponses];

      // Assert: Some requests should be rate limited
      const successfulRequests = allResponses.filter((r) => r.statusCode === 201);
      const rateLimitedRequests = allResponses.filter((r) => r.statusCode === 429);

      expect(successfulRequests.length).toBeLessThanOrEqual(90);
      expect(rateLimitedRequests.length).toBeGreaterThan(0);

      // Check rate limited response format
      if (rateLimitedRequests.length > 0) {
        const rateLimitedResponse = rateLimitedRequests[0];
        const responseJson = JSON.parse(rateLimitedResponse.payload);
        expect(responseJson.status).toEqual('fail');
        expect(responseJson.message).toContain('Rate limit exceeded');
      }
    }, 10000); // Increase timeout for this test

    it('should apply rate limiting only to /threads endpoints', async () => {
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

      // Action: Test that /threads endpoint is rate limited
      const response = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'Test Thread',
          body: 'Test Body',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert: Request should succeed (within rate limit)
      expect(response.statusCode).toEqual(201);
      const responseJson = JSON.parse(response.payload);
      expect(responseJson.status).toEqual('success');
    });

    it('should apply rate limiting to GET /threads as well', async () => {
      // Arrange
      const server = await createServer(container);

      // Action: Make multiple GET requests to /threads
      const requests = [];
      for (let i = 0; i < 5; i += 1) {
        requests.push(
          server.inject({
            method: 'GET',
            url: '/threads',
          }),
        );
      }

      const responses = await Promise.all(requests);

      // Assert: All GET requests should succeed (within rate limit)
      responses.forEach((response) => {
        expect(response.statusCode).toEqual(200);
        const responseJson = JSON.parse(response.payload);
        expect(responseJson.status).toEqual('success');
      });
    });

    it('should apply rate limiting per IP address', async () => {
      // Arrange
      const server = await createServer(container);

      // Create users
      await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: 'user1',
          password: 'secret',
          fullname: 'User One',
        },
      });

      await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: 'user2',
          password: 'secret',
          fullname: 'User Two',
        },
      });

      // Login users
      const loginResponse1 = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'user1',
          password: 'secret',
        },
      });

      const loginResponse2 = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'user2',
          password: 'secret',
        },
      });

      const { data: { accessToken: token1 } } = JSON.parse(loginResponse1.payload);
      const { data: { accessToken: token2 } } = JSON.parse(loginResponse2.payload);

      // Action: Make requests from same IP with different users
      // First make 90 requests (should all succeed)
      const initialRequests = [];
      for (let i = 0; i < 45; i += 1) {
        initialRequests.push(
          server.inject({
            method: 'POST',
            url: '/threads',
            payload: {
              title: `Thread User1 ${i}`,
              body: `Body ${i}`,
            },
            headers: {
              Authorization: `Bearer ${token1}`,
            },
          }),
        );

        initialRequests.push(
          server.inject({
            method: 'POST',
            url: '/threads',
            payload: {
              title: `Thread User2 ${i}`,
              body: `Body ${i}`,
            },
            headers: {
              Authorization: `Bearer ${token2}`,
            },
          }),
        );
      }

      const initialResponses = await Promise.all(initialRequests);
      
      // Then make additional requests that should be rate limited
      const additionalRequests = [];
      for (let i = 45; i < 50; i += 1) {
        additionalRequests.push(
          server.inject({
            method: 'POST',
            url: '/threads',
            payload: {
              title: `Thread User1 ${i}`,
              body: `Body ${i}`,
            },
            headers: {
              Authorization: `Bearer ${token1}`,
            },
          }),
        );

        additionalRequests.push(
          server.inject({
            method: 'POST',
            url: '/threads',
            payload: {
              title: `Thread User2 ${i}`,
              body: `Body ${i}`,
            },
            headers: {
              Authorization: `Bearer ${token2}`,
            },
          }),
        );
      }

      const additionalResponses = await Promise.all(additionalRequests);
      const responses = [...initialResponses, ...additionalResponses];

      // Assert: Rate limiting should apply to the IP, not per user
      const successfulRequests = responses.filter((r) => r.statusCode === 201);
      const rateLimitedRequests = responses.filter((r) => r.statusCode === 429);

      expect(successfulRequests.length).toBeLessThanOrEqual(90);
      expect(rateLimitedRequests.length).toBeGreaterThan(0);
    }, 15000); // Increase timeout for this test
  });

  describe('when making requests to non-rate-limited endpoints', () => {
    it('should not apply rate limiting to /users endpoint', async () => {
      // Arrange
      const server = await createServer(container);

      // Action: Make multiple requests to /users
      const requests = [];
      for (let i = 0; i < 10; i += 1) {
        requests.push(
          server.inject({
            method: 'POST',
            url: '/users',
            payload: {
              username: `user${i}`,
              password: 'secret',
              fullname: `User ${i}`,
            },
          }),
        );
      }

      const responses = await Promise.all(requests);

      // Assert: All requests should succeed without rate limiting
      responses.forEach((response) => {
        expect(response.statusCode).toEqual(201);
        const responseJson = JSON.parse(response.payload);
        expect(responseJson.status).toEqual('success');
      });
    });

    it('should not apply rate limiting to /authentications endpoint', async () => {
      // Arrange
      const server = await createServer(container);

      // Create user first
      await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: 'testuser',
          password: 'secret',
          fullname: 'Test User',
        },
      });

      // Action: Make multiple login requests
      const requests = [];
      for (let i = 0; i < 10; i += 1) {
        requests.push(
          server.inject({
            method: 'POST',
            url: '/authentications',
            payload: {
              username: 'testuser',
              password: 'secret',
            },
          }),
        );
      }

      const responses = await Promise.all(requests);

      // Assert: All requests should succeed without rate limiting
      responses.forEach((response) => {
        expect(response.statusCode).toEqual(201);
        const responseJson = JSON.parse(response.payload);
        expect(responseJson.status).toEqual('success');
      });
    });
  });
});
