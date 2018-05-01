import { QueryResult } from 'pg';
import { Service, ServiceMetadata } from '../../../core';

import { Database } from '../../../db';


const REF = 'session.query-service';
const GLOBAL = false;
const DEPS = [
  Database.REF
];

export class SessionQueryService implements Service {
  public static REF: string = REF;

  constructor(
    private db: Database
  ) {}


  public checkSession(userId: string, lastReset: string): Promise<string | null> {
    const query = `
    SELECT account_id
    FROM credentials AS crds
    WHERE crds.account_id = $1 AND crds.latest_token_reset = $2;`;

    return this.db.getClient()
      .query(query, [userId, lastReset])
      .then((res: QueryResult) => res.rows.length > 0 ? userId : null)
  }
}


export const sessionQueryService: ServiceMetadata = {
  ref: REF,
  dependenciesRefs: DEPS,
  globalScope: GLOBAL,
  factory: SessionQueryService
};
