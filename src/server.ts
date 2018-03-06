import * as Restify from 'restify';

import { Database } from './database/database';

import { AuthModule } from './routes/auth';


export class Server {
  private database: Database;
  private restifyServer: Restify.Server;

  constructor(dbClient: Database) {
    this.database = dbClient;

    const server = Restify.createServer();
    server.use(Restify.plugins.acceptParser(server.acceptable));
    server.use(Restify.plugins.bodyParser({ mapParams: false }));
    this.restifyServer = server;

    const authModule = AuthModule(this.database);

    authModule.registerRouteModule(this.restifyServer);
  }


  public listen(port: number) {
    this.restifyServer.listen(port, () => {
      console.log('%s listening at %s', this.restifyServer.name, this.restifyServer.url);
    })
  }
}
