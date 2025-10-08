const HealthHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'health',
  register: async (server) => {
    const healthHandler = new HealthHandler();
    server.route(routes(healthHandler));
  },
};
