import { Client } from 'pg';


export class Database {
  private client: any;
  private status: any;
  private error: any;

  constructor(credentials) {
    this.client = new Client(credentials);
    this.status = 'connecting';
    this.client.connect((err) => {
      if (err) {
        this.status = 'error';
        this.error = err;
        console.error('Postgres connection error : ', err);
      } else {
        this.status = 'ok';
        console.log('Postgres connection OK');
      }
    });
  }

  getClient() {
    if (this.status !== 'ok') {
      throw new Error(`Trying to get Postgres client, but no connection made yet (status: ${this.status})`);
    }
    return this.client;
  }

}
