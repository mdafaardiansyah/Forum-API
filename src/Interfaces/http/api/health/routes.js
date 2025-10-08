const routes = (handler) => [
  {
    method: 'GET',
    path: '/health',
    handler: handler.getHealthHandler,
  },
  {
    method: 'GET',
    path: '/health/ready',
    handler: handler.getHealthHandler,
  },
  {
    method: 'GET',
    path: '/health/live',
    handler: handler.getHealthHandler,
  },
];

module.exports = routes;
