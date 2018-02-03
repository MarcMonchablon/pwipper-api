const restify = require('restify');

const loginRoute = require('./routes/auth/login/login.route.js');


module.exports = class Server {
  constructor() {
    this.restifyServer = restify.createServer();

    loginRoute.register(this.restifyServer);
    const respond = function(req, res, next) {
      res.send('glup ' + req.params.name);
      next();
    };

    this.restifyServer.get('/hello/:name', respond);
  }

  listen(port) {
    this.restifyServer.listen(port, () => {
      console.log('%s listening at %s', this.restifyServer.name, this.restifyServer.url);
    })
  }
};
