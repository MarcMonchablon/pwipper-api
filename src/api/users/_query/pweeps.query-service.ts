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

}


export const pweepsQueryService: ServiceMetadata = {
  ref: REF,
  dependenciesRefs: DEPS,
  globalScope: GLOBAL,
  factory: PweepsQueryService
};
