const monitoringConfig = require('../../Commons/config/monitoring');

const performanceMonitoringMiddleware = {
  name: 'performance-monitoring',
  async register(server) {
    if (!monitoringConfig.performance.enabled) {
      return;
    }

    // Track request performance
    server.ext('onRequest', (request, h) => {
      request.app.startTime = Date.now();
      return h.continue;
    });

    server.ext('onPreResponse', (request, h) => {
      const responseTime = Date.now() - request.app.startTime;
      const slowThreshold = monitoringConfig.performance.slowRequestThreshold;

      // Log slow requests
      if (responseTime > slowThreshold) {
        const timestamp = new Date().toISOString();
        const method = request.method.toUpperCase();
        const { path } = request;

        console.warn(`[${timestamp}] SLOW REQUEST: ${method} ${path} - ${responseTime}ms (threshold: ${slowThreshold}ms)`);
      }

      // Add performance headers
      if (request.response && !request.response.isBoom) {
        request.response.header('X-Response-Time', `${responseTime}ms`);
      }

      return h.continue;
    });

    // Memory usage monitoring
    const memoryMonitorInterval = setInterval(() => {
      const memoryUsage = process.memoryUsage();
      const memoryUsageMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
      const memoryThreshold = monitoringConfig.performance.memoryUsageAlert;

      if (memoryUsageMB > memoryThreshold) {
        const timestamp = new Date().toISOString();
        console.warn(`[${timestamp}] HIGH MEMORY USAGE: ${memoryUsageMB}MB (threshold: ${memoryThreshold}MB)`);
        console.warn('Memory details:', {
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
          external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        });
      }
    }, 30000); // Check every 30 seconds

    // Clean up interval on server stop
    server.events.on('stop', () => {
      clearInterval(memoryMonitorInterval);
    });

    // Process monitoring
    process.on('uncaughtException', (error) => {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] UNCAUGHT EXCEPTION:`, error);
      // Don't exit in production, log and continue
      if (process.env.NODE_ENV === 'production') {
        console.error('Application continuing despite uncaught exception');
      }
    });

    process.on('unhandledRejection', (reason, promise) => {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] UNHANDLED REJECTION at:`, promise, 'reason:', reason);
    });
  },
};

module.exports = performanceMonitoringMiddleware;
