import { QueryResult } from 'pg';
import { Service, ServiceMetadata } from '../../../core';

import { Database } from '../../../db';

import { SimpleUserData } from '../_models/simple-user-data.model';
import { FullUserData } from '../_models/full-user-data.model';


const REF = 'users.query-service';
const GLOBAL = false;
const DEPS = [Database.REF];

export class UsersQueryService implements Service {
  public static REF: string = REF;

  constructor(
    private db: Database
  ) {}


  public getUserList(): Promise<SimpleUserData[]> {
    const query = `
    SELECT
      id AS id,
      username AS username
    FROM accounts;
    `;

    return this.db.getClient()
      .query(query)
      .then((pgResult: QueryResult) => {
        return pgResult.rows
          .map((data: any): SimpleUserData => ({
            id: data.id,
            username: data.username
          }));
      });
  }


  public getUserById(userId: string): Promise<FullUserData | null> {
    const query = `
    SELECT 
      id AS id,
      username AS username,
      email AS email,
      bio AS bio,
      creation_date AS creation_date,
      had_first_tour AS had_first_tour
    FROM accounts
    WHERE id = $1
    `;

    return this.db.getClient()
      .query(query, [userId])
      .then((pgResult: QueryResult) => this.userMapping(pgResult));
  }


  public getUserByUsername(username: string): Promise<FullUserData | null> {
    const query = `
    SELECT 
      id AS id,
      username AS username,
      email AS email,
      bio AS bio,
      creation_date AS creation_date,
      had_first_tour AS had_first_tour
    FROM accounts
    WHERE username = $1
    `;

    return this.db.getClient()
      .query(query, [username])
      .then((pgResult: QueryResult) => this.userMapping(pgResult));
  }


  private userMapping(pgResult: QueryResult): FullUserData | null {
    if (pgResult.rows.length < 1) { return null }
    const data = pgResult.rows[0];

    return {
      id: data.id,
      username: data.username,
      email: data.email,
      bio: data.bio,
      creationDate: data.creation_date,
      hadFirstTour: data.had_first_tour
    };
  }

}


export const usersQueryService: ServiceMetadata = {
  ref: REF,
  dependenciesRefs: DEPS,
  globalScope: GLOBAL,
  factory: UsersQueryService
};
