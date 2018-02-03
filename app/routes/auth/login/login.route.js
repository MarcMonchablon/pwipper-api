const Route = require('../../_models/route.model');

module.exports = new Route('GET', 'auth/login', function (req, res, next) {
  res.send('login route ok !');
  next();
});
