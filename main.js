const Server = require('./app/server.js');

// CONFIG
const port = 4100;

// MAIN
const server = new Server();
server.listen(port);
