const RouteModule = require('../_models/route-module.model.js');

const AuthQueryService = require('./_query/auth.query-service.js');


function AuthModule(dbClient) {
  const authModule = new RouteModule('AuthModule');

  const authQueryService = new AuthQueryService(dbClient);

  const loginRoute = require('./login/login.route.js')(authQueryService);
  authModule.addRoute(loginRoute);

  return authModule;
}

module.exports = AuthModule;
