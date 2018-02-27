const errs = require('restify-errors');
const Route = require('../../_models/route.model');

module.exports = function(authModule) {
  const route = new Route('auth/login');

  const authQueryService = authModule.getService('authQueryService');
  const accountValidationService = authModule.getService('accountValidationService');
  const credentialsService = authModule.getService('credentialsService');


  const login_POST = function (req, res, next) {
    // Check for missing parameters in body
    if (!(req.body && req.body['email-or-username'] && req.body['password'])) {
      return next(new errs.PreconditionFailedError("Payload should contain fields 'email-or-username' and 'password"));
    }

    // TODO: Ajouter les trucs CORS pour OPTIONS.  (creer objet endpoint ? mettre ça dans un autre middleman ?)
    const emailOrUsername = req.body['email-or-username'];
    const password = req.body['password'];
    const data$= accountValidationService.isEmail(emailOrUsername) ?
      authQueryService.checkLogin_email(emailOrUsername, password) :
      authQueryService.checkLogin_username(emailOrUsername, password);

    data$.then(data => {
      if (data.empty || !credentialsService.passwordMatch(data.account, data.credentials, password)) {
        res.send({ loginSuccessful: false });
        next();
      } else {
        res.send({ loginSuccessful: true, account: data.account });
        next();
      }
    }).catch(e => {
      console.error('LoginResponse: Something unexpected happened : ', e);
      next(new errs.InternalServerError(e));
    });
  };


  route.addEndpoint('POST', login_POST);
  return route;
};



