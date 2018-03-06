import { Server } from './server';
import { Database } from './database/database';

// CONFIG
const port = 4100;
const databaseCredentials = require('../env/database-credentials.secret.js');

// MAIN
const db: Database = new Database(databaseCredentials);
const server: Server = new Server(db);
server.listen(port);