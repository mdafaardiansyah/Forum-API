const monitoringConfig = require('../monitoring');

describe('monitoring configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should have correct default configuration', () => {
    expect(monitoringConfig).toHaveProperty('health');
    expect(monitoringConfig).toHaveProperty('logging');
    expect(monitoringConfig).toHaveProperty('metrics');
    expect(monitoringConfig).toHaveProperty('performance');
    expect(monitoringConfig).toHaveProperty('database');
  });

  it('should disable logging when NODE_ENV is test', () => {
    process.env.NODE_ENV = 'test';
    delete require.cache[require.resolve('../monitoring')];
    const config = require('../monitoring');
    
    expect(config.logging.enabled).toBe(false);
  });

  it('should enable logging when NODE_ENV is not test', () => {
    process.env.NODE_ENV = 'development';
    delete require.cache[require.resolve('../monitoring')];
    const config = require('../monitoring');
    
    expect(config.logging.enabled).toBe(true);
  });

  it('should use custom LOG_LEVEL when provided', () => {
    process.env.LOG_LEVEL = 'debug';
    delete require.cache[require.resolve('../monitoring')];
    const config = require('../monitoring');
    
    expect(config.logging.level).toBe('debug');
  });

  it('should use default LOG_LEVEL when not provided', () => {
    delete process.env.LOG_LEVEL;
    delete require.cache[require.resolve('../monitoring')];
    const config = require('../monitoring');
    
    expect(config.logging.level).toBe('info');
  });

  it('should use custom LOG_FORMAT when provided', () => {
    process.env.LOG_FORMAT = 'text';
    delete require.cache[require.resolve('../monitoring')];
    const config = require('../monitoring');
    
    expect(config.logging.format).toBe('text');
  });

  it('should use default LOG_FORMAT when not provided', () => {
    delete process.env.LOG_FORMAT;
    delete require.cache[require.resolve('../monitoring')];
    const config = require('../monitoring');
    
    expect(config.logging.format).toBe('json');
  });

  it('should enable metrics when ENABLE_METRICS is true', () => {
    process.env.ENABLE_METRICS = 'true';
    delete require.cache[require.resolve('../monitoring')];
    const config = require('../monitoring');
    
    expect(config.metrics.enabled).toBe(true);
  });

  it('should disable metrics when ENABLE_METRICS is not true', () => {
    process.env.ENABLE_METRICS = 'false';
    delete require.cache[require.resolve('../monitoring')];
    const config = require('../monitoring');
    
    expect(config.metrics.enabled).toBe(false);
  });

  it('should enable performance monitoring when ENABLE_PERFORMANCE_MONITORING is true', () => {
    process.env.ENABLE_PERFORMANCE_MONITORING = 'true';
    delete require.cache[require.resolve('../monitoring')];
    const config = require('../monitoring');
    
    expect(config.performance.enabled).toBe(true);
  });

  it('should disable performance monitoring when ENABLE_PERFORMANCE_MONITORING is not true', () => {
    process.env.ENABLE_PERFORMANCE_MONITORING = 'false';
    delete require.cache[require.resolve('../monitoring')];
    const config = require('../monitoring');
    
    expect(config.performance.enabled).toBe(false);
  });

  it('should use custom SLOW_REQUEST_THRESHOLD when provided', () => {
    process.env.SLOW_REQUEST_THRESHOLD = '2000';
    delete require.cache[require.resolve('../monitoring')];
    const config = require('../monitoring');
    
    expect(config.performance.slowRequestThreshold).toBe(2000);
  });

  it('should use default SLOW_REQUEST_THRESHOLD when not provided', () => {
    delete process.env.SLOW_REQUEST_THRESHOLD;
    delete require.cache[require.resolve('../monitoring')];
    const config = require('../monitoring');
    
    expect(config.performance.slowRequestThreshold).toBe(1000);
  });

  it('should use custom MEMORY_USAGE_ALERT when provided', () => {
    process.env.MEMORY_USAGE_ALERT = '1000';
    delete require.cache[require.resolve('../monitoring')];
    const config = require('../monitoring');
    
    expect(config.performance.memoryUsageAlert).toBe(1000);
  });

  it('should use default MEMORY_USAGE_ALERT when not provided', () => {
    delete process.env.MEMORY_USAGE_ALERT;
    delete require.cache[require.resolve('../monitoring')];
    const config = require('../monitoring');
    
    expect(config.performance.memoryUsageAlert).toBe(500);
  });

  it('should enable database query logging when LOG_DB_QUERIES is true', () => {
    process.env.LOG_DB_QUERIES = 'true';
    delete require.cache[require.resolve('../monitoring')];
    const config = require('../monitoring');
    
    expect(config.database.logQueries).toBe(true);
  });

  it('should disable database query logging when LOG_DB_QUERIES is not true', () => {
    process.env.LOG_DB_QUERIES = 'false';
    delete require.cache[require.resolve('../monitoring')];
    const config = require('../monitoring');
    
    expect(config.database.logQueries).toBe(false);
  });

  it('should use custom SLOW_QUERY_THRESHOLD when provided', () => {
    process.env.SLOW_QUERY_THRESHOLD = '2000';
    delete require.cache[require.resolve('../monitoring')];
    const config = require('../monitoring');
    
    expect(config.database.slowQueryThreshold).toBe(2000);
  });

  it('should use default SLOW_QUERY_THRESHOLD when not provided', () => {
    delete process.env.SLOW_QUERY_THRESHOLD;
    delete require.cache[require.resolve('../monitoring')];
    const config = require('../monitoring');
    
    expect(config.database.slowQueryThreshold).toBe(1000);
  });
});