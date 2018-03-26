import { Client } from 'pg';
import { Service } from '../core';


export class Database implements Service {
  public static REF: string = 'db';
  private client: Client;
  private status: 'connecting' | 'ok' | 'error';
  private error: any;

  constructor(credentials: any) {
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

  public getClient() {
    if (this.status !== 'ok') {
      throw new Error(`Trying to get Postgres client, but no connection made yet (status: ${this.status})`);
    }
    return this.client;
  }

}
