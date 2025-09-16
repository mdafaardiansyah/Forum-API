class HealthHandler {
  constructor() {
    this.getHealthHandler = this.getHealthHandler.bind(this);
  }

  async getHealthHandler(request, h) {
    const response = h.response({
      status: 'success',
      data: {
        health: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
      },
    });
    response.code(200);
    return response;
  }
}

module.exports = HealthHandler;
