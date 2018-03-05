const Server = require('./server.js');
const Database = require('./database/database');

// CONFIG
const port = 4100;
const databaseCredentials = require('../env/database-credentials.secret.js');

// MAIN
const db = new Database(databaseCredentials);
const server = new Server(db);
server.listen(port);
