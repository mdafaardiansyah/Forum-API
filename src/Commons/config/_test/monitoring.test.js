describe('monitoring config', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    jest.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should have required properties', () => {
    // eslint-disable-next-line global-require
    const monitoringConfig = require('../monitoring');

    expect(monitoringConfig).toHaveProperty('logging');
    expect(monitoringConfig).toHaveProperty('metrics');
    expect(monitoringConfig).toHaveProperty('database');
  });

  it('should disable logging when NODE_ENV is test', () => {
    process.env.NODE_ENV = 'test';
    jest.resetModules();
    // eslint-disable-next-line global-require
    const config = require('../monitoring');

    expect(config.logging.enabled).toBe(false);
  });

  it('should enable logging when NODE_ENV is not test', () => {
    process.env.NODE_ENV = 'development';
    jest.resetModules();
    // eslint-disable-next-line global-require
    const config = require('../monitoring');

    expect(config.logging.enabled).toBe(true);
  });

  it('should use custom LOG_LEVEL when provided', () => {
    process.env.LOG_LEVEL = 'debug';
    jest.resetModules();
    // eslint-disable-next-line global-require
    const config = require('../monitoring');

    expect(config.logging.level).toBe('debug');
  });

  it('should use default LOG_LEVEL when not provided', () => {
    delete process.env.LOG_LEVEL;
    jest.resetModules();
    // eslint-disable-next-line global-require
    const config = require('../monitoring');

    expect(config.logging.level).toBe('info');
  });

  it('should use custom LOG_FORMAT when provided', () => {
    process.env.LOG_FORMAT = 'text';
    jest.resetModules();
    // eslint-disable-next-line global-require
    const config = require('../monitoring');

    expect(config.logging.format).toBe('text');
  });

  it('should use default LOG_FORMAT when not provided', () => {
    delete process.env.LOG_FORMAT;
    jest.resetModules();
    // eslint-disable-next-line global-require
    const config = require('../monitoring');

    expect(config.logging.format).toBe('json');
  });

  it('should enable metrics when ENABLE_METRICS is true', () => {
    process.env.ENABLE_METRICS = 'true';
    jest.resetModules();
    // eslint-disable-next-line global-require
    const config = require('../monitoring');

    expect(config.metrics.enabled).toBe(true);
  });

  it('should disable metrics when ENABLE_METRICS is not true', () => {
    process.env.ENABLE_METRICS = 'false';
    jest.resetModules();
    // eslint-disable-next-line global-require
    const config = require('../monitoring');

    expect(config.metrics.enabled).toBe(false);
  });

  it('should enable performance monitoring when ENABLE_PERFORMANCE_MONITORING is true', () => {
    process.env.ENABLE_PERFORMANCE_MONITORING = 'true';
    jest.resetModules();
    // eslint-disable-next-line global-require
    const config = require('../monitoring');

    expect(config.performance.enabled).toBe(true);
  });

  it('should disable performance monitoring when ENABLE_PERFORMANCE_MONITORING is not true', () => {
    process.env.ENABLE_PERFORMANCE_MONITORING = 'false';
    jest.resetModules();
    // eslint-disable-next-line global-require
    const config = require('../monitoring');

    expect(config.performance.enabled).toBe(false);
  });

  it('should use custom SLOW_REQUEST_THRESHOLD when provided', () => {
    process.env.SLOW_REQUEST_THRESHOLD = '2000';
    jest.resetModules();
    // eslint-disable-next-line global-require
    const config = require('../monitoring');

    expect(config.performance.slowRequestThreshold).toBe(2000);
  });

  it('should use default SLOW_REQUEST_THRESHOLD when not provided', () => {
    delete process.env.SLOW_REQUEST_THRESHOLD;
    jest.resetModules();
    // eslint-disable-next-line global-require
    const config = require('../monitoring');

    expect(config.performance.slowRequestThreshold).toBe(1000);
  });

  it('should use custom MEMORY_USAGE_ALERT when provided', () => {
    process.env.MEMORY_USAGE_ALERT = '1000';
    jest.resetModules();
    // eslint-disable-next-line global-require
    const config = require('../monitoring');

    expect(config.performance.memoryUsageAlert).toBe(1000);
  });

  it('should use default MEMORY_USAGE_ALERT when not provided', () => {
    delete process.env.MEMORY_USAGE_ALERT;
    jest.resetModules();
    // eslint-disable-next-line global-require
    const config = require('../monitoring');

    expect(config.performance.memoryUsageAlert).toBe(500);
  });

  it('should enable database query logging when LOG_DB_QUERIES is true', () => {
    process.env.LOG_DB_QUERIES = 'true';
    jest.resetModules();
    // eslint-disable-next-line global-require
    const config = require('../monitoring');

    expect(config.database.logQueries).toBe(true);
  });

  it('should disable database query logging when LOG_DB_QUERIES is not true', () => {
    process.env.LOG_DB_QUERIES = 'false';
    jest.resetModules();
    // eslint-disable-next-line global-require
    const config = require('../monitoring');

    expect(config.database.logQueries).toBe(false);
  });

  it('should use custom SLOW_QUERY_THRESHOLD when provided', () => {
    process.env.SLOW_QUERY_THRESHOLD = '2000';
    jest.resetModules();
    // eslint-disable-next-line global-require
    const config = require('../monitoring');

    expect(config.database.slowQueryThreshold).toBe(2000);
  });

  it('should use default SLOW_QUERY_THRESHOLD when not provided', () => {
    delete process.env.SLOW_QUERY_THRESHOLD;
    jest.resetModules();
    // eslint-disable-next-line global-require
    const config = require('../monitoring');

    expect(config.database.slowQueryThreshold).toBe(1000);
  });
});
