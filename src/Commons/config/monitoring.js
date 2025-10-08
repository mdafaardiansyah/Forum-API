const monitoringConfig = {
  // Health check configuration
  health: {
    enabled: true,
    endpoints: {
      health: '/health',
      ready: '/health/ready',
      live: '/health/live',
    },
  },

  // Logging configuration
  logging: {
    enabled: process.env.NODE_ENV !== 'test',
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    includeRequestId: true,
    logRequests: true,
    logResponses: true,
    logErrors: true,
  },

  // Metrics configuration
  metrics: {
    enabled: process.env.ENABLE_METRICS === 'true',
    endpoint: '/metrics',
    collectDefaultMetrics: true,
    requestDuration: true,
    requestCount: true,
    errorCount: true,
  },

  // Performance monitoring
  performance: {
    enabled: process.env.ENABLE_PERFORMANCE_MONITORING === 'true',
    slowRequestThreshold: parseInt(process.env.SLOW_REQUEST_THRESHOLD, 10) || 1000, // ms
    memoryUsageAlert: parseInt(process.env.MEMORY_USAGE_ALERT, 10) || 500, // MB
  },

  // Database monitoring
  database: {
    enabled: true,
    logQueries: process.env.LOG_DB_QUERIES === 'true',
    slowQueryThreshold: parseInt(process.env.SLOW_QUERY_THRESHOLD, 10) || 1000, // ms
  },
};

module.exports = monitoringConfig;
