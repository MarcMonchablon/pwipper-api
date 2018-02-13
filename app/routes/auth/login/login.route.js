const errs = require('restify-errors');
const Route = require('../../_models/route.model');

module.exports = function(authModule) {
  const authQueryService = authModule.getService('authQueryService');
  const accountValidationService = authModule.getService('accountValidationService');


  const LoginResponseFn = function (req, res, next) {

    // Check for missing parameters in body
    if (!(req.body && req.body['email-or-username'] && req.body['password'])) {
      return next(new errs.PreconditionFailedError("Payload should contain fields 'email-or-username' and 'password"));
    }

    const emailOrUsername = req.body['email-or-username'];
    const password = req.body['password'];
    const query = accountValidationService.isEmail(emailOrUsername) ?
      authQueryService.checkLogin_email(emailOrUsername, password) :
      authQueryService.checkLogin_username(emailOrUsername, password);

    // TODO
    res.send(query);
    next();
  };

  return new Route('POST', 'auth/login', LoginResponseFn);
};
