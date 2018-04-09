import { QueryResult } from 'pg';
import { Service, ServiceMetadata } from '../../../core';

import { Database } from '../../../db';

import { Pweep } from '../_models/pweep.model';


const REF = 'pweeps.query-service';
const GLOBAL = false;
const DEPS = [Database.REF];

export class PweepsQueryService implements Service {
  public static REF: string = REF;
  private db: Database;

  constructor(database: Database) {
    this.db = database;
  }


  public createPweeps(userId: string, content: string): Promise<Pweep> {
    const query = `
    INSERT INTO pweeps (user_id, content) VALUES ($1, $2)
    RETURNING id, user_id, timestamp, content;
    `;

    return this.db.getClient()
      .query(query, [userId, content])
      .then(pgResult => {

        if (pgResult.rows.length < 1) {
          throw new Error('CreatePweep: no row returned from database.');
        } else {
          const createdPweed = pgResult.rows[0];
          return {
            id: createdPweed.id,
            userId: createdPweed.user_id,
            timestamp: createdPweed.timestamp,
            content: createdPweed.content
          };
        }
      });
  }


  public getPweeps(userId: string): Promise<Pweep[]> {
    const queryText = `
    SELECT 
      id AS id,
      user_id AS userId,
      timestamp AS timestamp,
      content AS content
    FROM pweeps
    WHERE user_id = $1
    ORDER by timestamp DESC;
    `;

    const query = {
      text: queryText,
      values: [userId]
  //    rowMode: 'array'
    };

    return this.db.getClient()
      .query(query)
      .then(pgResult => {
        return pgResult.rows
          .map((data: any): Pweep => ({
            id: data.id,
            userId: data.userId,
            timestamp: data.timeStamp,
            content: data.content
          }));
      });
  }

}


export const pweepsQueryService: ServiceMetadata = {
  ref: REF,
  dependenciesRefs: DEPS,
  globalScope: GLOBAL,
  factory: PweepsQueryService
};
