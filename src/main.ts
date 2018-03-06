import { Server } from './server';
import { Database } from './database/database';

// CONFIG
const port = 4100;
const databaseCredentials = require('../env/database-credentials.secret.js');

// MAIN
const db = new Database(databaseCredentials);
const server = new Server(db);
server.listen(port);