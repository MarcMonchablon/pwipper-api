const Route = require('../../_models/route.model');

module.exports = function(authQueryService) {

  const responseFn = function (req, res, next) {
    res.send('login route ok !');
    authQueryService.fetchAccount(1);
    next();
  };


  return new Route('GET', 'auth/login', responseFn);
};
