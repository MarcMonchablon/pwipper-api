import * as Restify from 'restify';

//import { Server } from './server';
import { Database } from './db';

import { rootModuleFactory } from './root.module';

// CONFIG
const port = 4100;
const databaseCredentials = require('../env/database-credentials.secret.js');

// DEBUG
process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
});


// MAIN
const db: Database = new Database(databaseCredentials);
//const server: Server = new Server(db);
//server.listen(port);

const server = Restify.createServer();
server.use(Restify.plugins.acceptParser(server.acceptable));
server.use(Restify.plugins.bodyParser({ mapParams: false }));


const rootModule = rootModuleFactory({db: db});
rootModule.init();
rootModule.status$.on('ready-for-routes-activations').then(() => {
  rootModule.activateRoutes(server);

  server.listen(port, () => {
    console.log('%s listening at %s', server.name, server.url);
  });
});

