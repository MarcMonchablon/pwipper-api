const restify = require('restify');

const AuthModule = require('./routes/auth');

class Server {
  constructor(dbClient) {
    this.database = dbClient;

    const server = restify.createServer();
    server.use(restify.plugins.acceptParser(server.acceptable));
    server.use(restify.plugins.bodyParser({ mapParams: false }));
    this.restifyServer = server;

    const authModule = AuthModule(this.database);

    authModule.registerRouteModule(this.restifyServer);
  }


  listen(port) {
    this.restifyServer.listen(port, () => {
      console.log('%s listening at %s', this.restifyServer.name, this.restifyServer.url);
    })
  }
}

module.exports = Server;
