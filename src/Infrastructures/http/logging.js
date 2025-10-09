const loggingMiddleware = {
  name: 'logging',
  async register(server) {
    // Request logging
    server.ext('onRequest', (request, h) => {
      const timestamp = new Date().toISOString();
      const {
        method, path, info, headers,
      } = request;
      const methodUpper = method.toUpperCase();
      const { remoteAddress: ip } = info;
      const userAgent = headers['user-agent'] || headers['User-Agent'] || 'Unknown';

      console.log(`[${timestamp}] ${methodUpper} ${path} - IP: ${ip} - User-Agent: ${userAgent}`);

      return h.continue;
    });

    // Response logging
    server.ext('onPreResponse', (request, h) => {
      const timestamp = new Date().toISOString();
      const {
        method, path, response, info,
      } = request;
      const methodUpper = method.toUpperCase();
      const statusCode = response.statusCode || (response.output && response.output.statusCode) || 'Unknown';
      const responseTime = Date.now() - info.received;

      console.log(`[${timestamp}] ${methodUpper} ${path} - Status: ${statusCode} - Response Time: ${responseTime}ms`);

      return h.continue;
    });

    // Error logging
    server.events.on('request', (request, event, tags) => {
      if (tags.error) {
        const timestamp = new Date().toISOString();
        const { method, path } = request;
        const methodUpper = method.toUpperCase();
        const { error, data } = event;
        const errorObj = error || data;

        console.error(`[${timestamp}] ERROR ${methodUpper} ${path} - ${errorObj.message || errorObj}`);
        if (errorObj.stack) {
          console.error(errorObj.stack);
        }
      }
    });
  },
};

module.exports = loggingMiddleware;
