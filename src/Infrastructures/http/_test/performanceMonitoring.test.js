const performanceMonitoringMiddleware = require('../performanceMonitoring');

// Mock the monitoring config
jest.mock('../../../Commons/config/monitoring', () => ({
  performance: {
    enabled: true,
    slowRequestThreshold: 1000,
    memoryUsageAlert: 500,
  },
}));

const monitoringConfig = require('../../../Commons/config/monitoring');

describe('performanceMonitoringMiddleware', () => {
  let server;
  let originalConsoleWarn;
  let originalConsoleError;
  let originalProcessEnv;
  let consoleWarnSpy;
  let consoleErrorSpy;
  let uncaughtExceptionListeners;
  let unhandledRejectionListeners;

  beforeEach(() => {
    // Store original listeners
    uncaughtExceptionListeners = process.listeners('uncaughtException');
    unhandledRejectionListeners = process.listeners('unhandledRejection');

    // Remove existing listeners to avoid conflicts
    process.removeAllListeners('uncaughtException');
    process.removeAllListeners('unhandledRejection');

    // Mock console methods
    originalConsoleWarn = console.warn;
    originalConsoleError = console.error;
    consoleWarnSpy = jest.fn();
    consoleErrorSpy = jest.fn();
    console.warn = consoleWarnSpy;
    console.error = consoleErrorSpy;

    // Mock server
    server = {
      ext: jest.fn(),
      events: {
        on: jest.fn(),
      },
    };

    // Store original process.env
    originalProcessEnv = process.env.NODE_ENV;

    // Clear any existing intervals
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    // Remove test listeners
    process.removeAllListeners('uncaughtException');
    process.removeAllListeners('unhandledRejection');

    // Restore original listeners
    uncaughtExceptionListeners.forEach((listener) => {
      process.on('uncaughtException', listener);
    });
    unhandledRejectionListeners.forEach((listener) => {
      process.on('unhandledRejection', listener);
    });

    // Restore console methods
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;

    // Restore process.env
    process.env.NODE_ENV = originalProcessEnv;

    // Clear timers
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('when performance monitoring is disabled', () => {
    it('should return early without registering middleware', async () => {
      // Mock disabled config
      monitoringConfig.performance.enabled = false;

      await performanceMonitoringMiddleware.register(server);

      expect(server.ext).not.toHaveBeenCalled();

      // Reset for other tests
      monitoringConfig.performance.enabled = true;
    });
  });

  describe('when performance monitoring is enabled', () => {
    beforeEach(() => {
      // Ensure config is enabled for these tests
      monitoringConfig.performance.enabled = true;
      monitoringConfig.performance.slowRequestThreshold = 1000;
      monitoringConfig.performance.memoryUsageAlert = 500;
    });

    it('should register onRequest and onPreResponse extensions', async () => {
      await performanceMonitoringMiddleware.register(server);

      expect(server.ext).toHaveBeenCalledWith('onRequest', expect.any(Function));
      expect(server.ext).toHaveBeenCalledWith('onPreResponse', expect.any(Function));
    });

    it('should track request start time in onRequest', async () => {
      await performanceMonitoringMiddleware.register(server);

      const onRequestHandler = server.ext.mock.calls.find((call) => call[0] === 'onRequest')[1];
      const request = { app: {} };
      const h = { continue: 'continue' };

      const result = onRequestHandler(request, h);

      expect(request.app.startTime).toBeDefined();
      expect(typeof request.app.startTime).toBe('number');
      expect(result).toBe('continue');
    });

    it('should log slow requests and add performance headers', async () => {
      await performanceMonitoringMiddleware.register(server);

      const onPreResponseHandler = server.ext.mock.calls.find((call) => call[0] === 'onPreResponse')[1];
      const request = {
        app: { startTime: Date.now() - 2000 }, // 2 seconds ago
        method: 'get',
        path: '/test',
        response: {
          isBoom: false,
          header: jest.fn(),
        },
      };
      const h = { continue: 'continue' };

      const result = onPreResponseHandler(request, h);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('SLOW REQUEST: GET /test'),
      );
      expect(request.response.header).toHaveBeenCalledWith(
        'X-Response-Time',
        expect.stringMatching(/\d+ms/),
      );
      expect(result).toBe('continue');
    });

    it('should not log fast requests but still add performance headers', async () => {
      await performanceMonitoringMiddleware.register(server);

      const onPreResponseHandler = server.ext.mock.calls.find((call) => call[0] === 'onPreResponse')[1];
      const request = {
        app: { startTime: Date.now() - 500 }, // 500ms ago
        method: 'post',
        path: '/fast',
        response: {
          isBoom: false,
          header: jest.fn(),
        },
      };
      const h = { continue: 'continue' };

      onPreResponseHandler(request, h);

      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(request.response.header).toHaveBeenCalledWith(
        'X-Response-Time',
        expect.stringMatching(/\d+ms/),
      );
    });

    it('should not add headers to boom responses', async () => {
      await performanceMonitoringMiddleware.register(server);

      const onPreResponseHandler = server.ext.mock.calls.find((call) => call[0] === 'onPreResponse')[1];
      const request = {
        app: { startTime: Date.now() - 500 },
        method: 'get',
        path: '/error',
        response: {
          isBoom: true,
        },
      };
      const h = { continue: 'continue' };

      onPreResponseHandler(request, h);

      expect(request.response.header).toBeUndefined();
    });

    it('should handle requests without response object', async () => {
      await performanceMonitoringMiddleware.register(server);

      const onPreResponseHandler = server.ext.mock.calls.find((call) => call[0] === 'onPreResponse')[1];
      const request = {
        app: { startTime: Date.now() - 500 },
        method: 'get',
        path: '/no-response',
        response: null,
      };
      const h = { continue: 'continue' };

      expect(() => onPreResponseHandler(request, h)).not.toThrow();
    });

    it('should monitor memory usage and log high usage', async () => {
      // Mock process.memoryUsage to return high memory usage
      const originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = jest.fn().mockReturnValue({
        heapUsed: 600 * 1024 * 1024, // 600MB
        heapTotal: 800 * 1024 * 1024, // 800MB
        external: 50 * 1024 * 1024, // 50MB
        rss: 900 * 1024 * 1024, // 900MB
      });

      await performanceMonitoringMiddleware.register(server);

      // Fast-forward time to trigger memory check
      jest.advanceTimersByTime(30000);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('HIGH MEMORY USAGE: 600MB (threshold: 500MB)'),
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Memory details:',
        expect.objectContaining({
          heapUsed: '600MB',
          heapTotal: '800MB',
          external: '50MB',
          rss: '900MB',
        }),
      );

      // Restore original function
      process.memoryUsage = originalMemoryUsage;
    });

    it('should not log memory usage when below threshold', async () => {
      // Mock process.memoryUsage to return low memory usage
      const originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = jest.fn().mockReturnValue({
        heapUsed: 400 * 1024 * 1024, // 400MB
        heapTotal: 500 * 1024 * 1024,
        external: 30 * 1024 * 1024,
        rss: 600 * 1024 * 1024,
      });

      await performanceMonitoringMiddleware.register(server);

      // Fast-forward time to trigger memory check
      jest.advanceTimersByTime(30000);

      expect(consoleWarnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('HIGH MEMORY USAGE'),
      );

      // Restore original function
      process.memoryUsage = originalMemoryUsage;
    });

    it('should register server stop event handler to clear interval', async () => {
      await performanceMonitoringMiddleware.register(server);

      expect(server.events.on).toHaveBeenCalledWith('stop', expect.any(Function));

      // Test that the stop handler clears the interval
      const stopHandler = server.events.on.mock.calls.find((call) => call[0] === 'stop')[1];
      expect(() => stopHandler()).not.toThrow();
    });

    it('should handle uncaught exceptions in production', async () => {
      process.env.NODE_ENV = 'production';

      await performanceMonitoringMiddleware.register(server);

      // Simulate uncaught exception
      const error = new Error('Test uncaught exception');
      process.emit('uncaughtException', error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('UNCAUGHT EXCEPTION:'),
        error,
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Application continuing despite uncaught exception',
      );
    });

    it('should handle uncaught exceptions in non-production', async () => {
      process.env.NODE_ENV = 'development';

      await performanceMonitoringMiddleware.register(server);

      // Simulate uncaught exception
      const error = new Error('Test uncaught exception');
      process.emit('uncaughtException', error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('UNCAUGHT EXCEPTION:'),
        error,
      );
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        'Application continuing despite uncaught exception',
      );
    });

    it('should handle unhandled promise rejections', async () => {
      await performanceMonitoringMiddleware.register(server);

      // Simulate unhandled rejection
      const reason = 'Test rejection reason';
      const promise = Promise.resolve(); // Use resolved promise to avoid actual rejection
      process.emit('unhandledRejection', reason, promise);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('UNHANDLED REJECTION at:'),
        promise,
        'reason:',
        reason,
      );
    });
  });

  describe('middleware name', () => {
    it('should have correct name', () => {
      expect(performanceMonitoringMiddleware.name).toBe('performance-monitoring');
    });
  });
});
