const { Client } = require('pg');

module.exports = class Database {
  constructor(credentials) {
    this.client = new Client(credentials);
    this.client.connect();
  }


  test() {
    const client = this.client;
    client.query(
      'SELECT $1::text as message', ['Hello world!'],
      (err, res) => {
        console.log(err ? err.stack : res.rows[0].message);
        client.end();
      }
    );
  }

};
