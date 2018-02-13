const restify = require('restify');

const AuthModule = require('./routes/auth');

class Server {
  constructor(dbClient) {
    this.restifyServer = restify.createServer();
    this.dbClient = dbClient;

    const authModule = AuthModule(this.dbClient);

    authModule.register(this.restifyServer);
  }

  listen(port) {
    this.restifyServer.listen(port, () => {
      console.log('%s listening at %s', this.restifyServer.name, this.restifyServer.url);
    })
  }
}

module.exports = Server;
