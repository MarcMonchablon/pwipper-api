import { QueryResult } from 'pg';
import { Service, ServiceMetadata } from '../../../core';

import { Database } from '../../../db';

import { FullUserData } from '../../users/_models/full-user-data.model';


export interface LoginData {
  session: {
    userId: string;
    latestReset: string
  };
  account: FullUserData;
  credentials: {
    hashingMethod: string;
    hash: string;
  };
}


const REF = 'auth.query-service';
const GLOBAL = false;
const DEPS = [
  Database.REF
];

export class AuthQueryService implements Service {
  public static REF: string = REF;

  constructor(
    private db: Database
  ) {}


  public fetchAccount_id(accountId: string) {
    console.log('AuthQueryService::fetchAccount_id:', accountId); // TODO
  }


  public fetchAccount_username(username: string) {
    console.log('AuthQueryService::fetchAccount_username:', username); // TODO
  }

  public createAccount(username: string, email: string, password: string) {
    const query = `
    WITH new_account AS (
      INSERT INTO accounts (username, email)
      VALUES ($1, $2)
      RETURNING id, username, email
    ), new_credentials AS (
      INSERT INTO credentials (account_id, hashing_method, hash)
        SELECT new_account.id, 'none', $3 FROM new_account
    ) SELECT id, username, email 
    FROM new_account;`;

    return this.db.getClient()
      .query(query, [username, email, password])
      .then(pgResult => {
        if (pgResult.rowCount !== 1) {
          console.error('auth.queryService::createAccount() : rowCount not equal to 1 :', pgResult);
          throw new Error('createAccount: rowCount now equal to 1');
        }
        const account = pgResult.rows[0];
        return {
          created: true,
          account: {
            id: account.id,
            username: account.username,
            email: account.email
          }
        };
      }).catch(pgError => {
        if (pgError.name !== 'error' || !pgError.code) {
          // probably not a pgError, don't know how to deal with it for now.
          throw pgError;
        }

        const response: any = {
          created: false,
        };
        switch (pgError.code) {
          case '22001':                              // 'string_data_right_truncation'
            response.errorType = 'string_data_right_truncation';
            response.errorData = {
              // it doesn't specify which column is too long,
              // so I should probably add CHECK on top of varchar(N) limit,
              // to have better error messages.
            };
            break;
          case '23505':                              // 'unique_violation'
            response.errorType = 'unique_violation';
            response.errorData = {
              constraint: pgError.constraint,
              detail: pgError.detail,
            };
            break;
          default:                                   // unhandled error
            console.error('unhandled SQL error: ');
            console.error(pgError);
            throw pgError;
        }
        return response;
      })
  }


  public checkSession(userId: string, latestReset: string): Promise<LoginData | null> {
    const query = `
    SELECT *
    FROM accounts INNER JOIN credentials ON (accounts.id = credentials.account_id)
    WHERE accounts.id = $1;`; //  AND credentials.latest_token_reset = $2
    // TODO: add latestReset check.

    return this.db.getClient()
      .query(query, [userId])
      .then(this._mapCheckLoginResult);
  }


  public checkLogin_email(email: string, password: string): Promise<LoginData | null> {
    const query = `
    SELECT * 
    FROM accounts INNER JOIN credentials ON (accounts.id = credentials.account_id)
    WHERE email = $1;`;

    return this.db.getClient()
      .query(query, [email])
      .then(this._mapCheckLoginResult);
  }


  public checkLogin_username(username: string, password: string): Promise<LoginData | null> {
    const query = `
    SELECT * 
    FROM accounts INNER JOIN credentials ON (accounts.id = credentials.account_id)
    WHERE username = $1;`;

    const self = this;
    return this.db.getClient()
      .query(query, [username])
      .then(this._mapCheckLoginResult);
  }


  private _mapCheckLoginResult = (pgResult: QueryResult): LoginData | null => {
    if (pgResult.rows.length === 0) {
      return null;
    } else {
      const row = pgResult.rows[0];
      return {
        session: {
          userId: row.account_id,
          latestReset: row.latest_token_reset
        },
        account: {
          id: row.account_id,
          username: row.username,
          email: row.email,
          bio: row.bio || '',
          creationDate: row.creation_date,
          hadFirstTour: row.had_first_tour
        },
        credentials: {
          hashingMethod: row.hashing_method,
          hash: row.hash
        }
      };
    }
  };
}


export const authQueryService: ServiceMetadata = {
  ref: REF,
  dependenciesRefs: DEPS,
  globalScope: GLOBAL,
  factory: AuthQueryService
};
