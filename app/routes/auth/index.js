const RouteModule = require('../_models/route-module.model.js');

const AuthQueryService = require('./_query/auth.query-service.js');
const AccountValidationService = require('./_service/account-validation.service.js');
const CredentialsService = require('./_service/credentials.service.js');
const LoginRouteFn = require('./login/login.route.js');


module.exports = function(dbClient) {
  const authModule = new RouteModule('AuthModule');

  authModule.addService('authQueryService', new AuthQueryService(dbClient));
  authModule.addService('accountValidationService', new AccountValidationService());
  authModule.addService('credentialsService', new CredentialsService());

  authModule.addRoute(LoginRouteFn);

  return authModule;
};
