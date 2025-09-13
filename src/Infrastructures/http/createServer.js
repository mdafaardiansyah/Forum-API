const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');
const loggingMiddleware = require('./logging');
const performanceMonitoringMiddleware = require('./performanceMonitoring');

// Rate limiting implementation
const rateLimitStore = new Map();

// Export rate limit store for testing purposes
if (process.env.NODE_ENV === 'test') {
  global.rateLimitStore = rateLimitStore;
}

const rateLimitMiddleware = {
  name: 'rate-limit',
  async register(server) {
    server.ext('onRequest', (request, h) => {
      // Skip rate limiting when DISABLE_RATE_LIMIT is set, but allow in test environment for rate-limiting.test.js
      if (process.env.DISABLE_RATE_LIMIT === 'true') {
        return h.continue;
      }

      const ip = request.info.remoteAddress;
      const now = Date.now();
      const windowMs = 60000; // 1 minute
      const maxRequests = 90;

      // Check if request is for /threads endpoints
      if (!request.path.startsWith('/threads')) {
        return h.continue;
      }

      // Get or create rate limit data for this IP
      let rateLimitData = rateLimitStore.get(ip);
      if (!rateLimitData) {
        rateLimitData = {
          count: 0,
          resetTime: now + windowMs,
        };
        rateLimitStore.set(ip, rateLimitData);
      }

      // Reset if window has passed
      if (now >= rateLimitData.resetTime) {
        rateLimitData.count = 0;
        rateLimitData.resetTime = now + windowMs;
      }
      
      // Increment counter first, then check limit (atomic operation)
      rateLimitData.count += 1;
      
      // Debug logging for tests
      if (process.env.NODE_ENV === 'test') {
        console.log(`Rate limit debug - IP: ${ip}, Count: ${rateLimitData.count}, Max: ${maxRequests}, Path: ${request.path}`);
      }
      
      // Check if limit exceeded after incrementing
      if (rateLimitData.count > maxRequests) {
        if (process.env.NODE_ENV === 'test') {
          console.log(`Rate limit exceeded - IP: ${ip}, Count: ${rateLimitData.count}`);
        }
        const response = h.response({
          status: 'fail',
          message: 'Rate limit exceeded. Too many requests.',
        }).code(429);
        return response.takeover();
      }

      return h.continue;
    });
  },
};
const ClientError = require('../../Commons/exceptions/ClientError');
const DomainErrorTranslator = require('../../Commons/exceptions/DomainErrorTranslator');
const users = require('../../Interfaces/http/api/users');
const authentications = require('../../Interfaces/http/api/authentications');
const threads = require('../../Interfaces/http/api/threads');
const comments = require('../../Interfaces/http/api/comments');
const replies = require('../../Interfaces/http/api/replies');
const likes = require('../../Interfaces/http/api/likes');
const health = require('../../Interfaces/http/api/health');

const createServer = async (container) => {
  const server = Hapi.server({
    host: process.env.HOST,
    port: process.env.PORT,
  });

  await server.register([
    {
      plugin: Jwt,
    },
  ]);

  // Register logging middleware
  await server.register(loggingMiddleware);

  // Register performance monitoring middleware
  await server.register(performanceMonitoringMiddleware);

  // Register rate limiting middleware
  await server.register(rateLimitMiddleware);

  // Security middleware
  server.ext('onPreResponse', (request, h) => {
    const { response } = request;

    // Add security headers
    if (response.isBoom) {
      // Handle error responses
      response.output.headers['X-Content-Type-Options'] = 'nosniff';
      response.output.headers['X-Frame-Options'] = 'DENY';
      response.output.headers['X-XSS-Protection'] = '1; mode=block';
      response.output.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
      response.output.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
      response.output.headers['Content-Security-Policy'] = "default-src 'self'";
    } else {
      // Handle successful responses
      response.header('X-Content-Type-Options', 'nosniff');
      response.header('X-Frame-Options', 'DENY');
      response.header('X-XSS-Protection', '1; mode=block');
      response.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      response.header('Referrer-Policy', 'strict-origin-when-cross-origin');
      response.header('Content-Security-Policy', "default-src 'self'");
    }

    return h.continue;
  });

  // HTTPS enforcement middleware (for production)
  server.ext('onRequest', (request, h) => {
    try {
      // Only enforce HTTPS in production
      if (process.env.NODE_ENV === 'production') {
        const forwardedProto = request.headers['x-forwarded-proto'];
        const { host } = request.headers;
        const isHttps = forwardedProto === 'https';

        if (!isHttps && host) {
          const httpsUrl = `https://${host}${request.url.pathname}${request.url.search || ''}`;
          return h.redirect(httpsUrl).code(301).takeover();
        }
      }

      return h.continue;
    } catch (error) {
      console.error('HTTPS enforcement error:', error);
      return h.continue;
    }
  });

  server.auth.strategy('forumapi_jwt', 'jwt', {
    keys: process.env.ACCESS_TOKEN_KEY,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: process.env.ACCESS_TOKEN_AGE,
    },
    validate: (artifacts) => ({
      isValid: true,
      credentials: {
        id: artifacts.decoded.payload.id,
      },
    }),
  });

  await server.register([
    {
      plugin: users,
      options: { container },
    },
    {
      plugin: authentications,
      options: { container },
    },
    {
      plugin: threads,
      options: { container },
    },
    {
      plugin: comments,
      options: { container },
    },
    {
      plugin: replies,
      options: { container },
    },
    {
      plugin: likes,
      options: { container },
    },
    {
      plugin: health,
    },
  ]);

  // server.auth.default('forumapi_jwt'); // Removed default auth to allow public endpoints

  // Add default route for health check
  server.route({
    method: 'GET',
    path: '/',
    handler: () => ({
      status: 'success',
      message: 'Forum API is running',
      version: '1.0.0',
      endpoints: {
        users: 'POST /users',
        authentications: 'POST /authentications, PUT /authentications, DELETE /authentications',
        threads: 'POST /threads, GET /threads/{threadId}',
        comments: 'POST /threads/{threadId}/comments, DELETE /threads/{threadId}/comments/{commentId}',
        replies: 'POST /threads/{threadId}/comments/{commentId}/replies, DELETE /threads/{threadId}/comments/{commentId}/replies/{replyId}',
        likes: 'PUT /threads/{threadId}/comments/{commentId}/likes',
      },
    }),
    options: {
      auth: false,
    },
  });

  server.ext('onPreResponse', (request, h) => {
    // mendapatkan konteks response dari request
    const { response } = request;

    if (response instanceof Error) {
      // bila response tersebut error, tangani sesuai kebutuhan
      const translatedError = DomainErrorTranslator.translate(response);

      // penanganan client error secara internal.
      if (translatedError instanceof ClientError) {
        const newResponse = h.response({
          status: 'fail',
          message: translatedError.message,
        });
        newResponse.code(translatedError.statusCode);
        return newResponse;
      }

      // mempertahankan penanganan client error oleh hapi secara native, seperti 404, etc.
      if (!translatedError.isServer) {
        return h.continue;
      }

      // penanganan server error sesuai kebutuhan
      const newResponse = h.response({
        status: 'fail',
        message: 'terjadi kegagalan pada server kami',
      });
      newResponse.code(500);
      return newResponse;
    }

    // jika bukan error, lanjutkan dengan response sebelumnya (tanpa terintervensi)
    return h.continue;
  });

  return server;
};

module.exports = createServer;
