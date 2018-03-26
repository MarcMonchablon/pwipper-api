import { QueryResult } from 'pg';
import { Service, ServiceMetadata } from '../../../core';

import { Database } from '../../../db';


export type CheckLoginResponse = CheckLoginResponse_Success | CheckLoginResponse_Fail;
export interface CheckLoginResponse_Fail { empty: true; }
export interface CheckLoginResponse_Success {
  empty: false;
  account: {
    id: string;
    username: string;
    email: string;
  };
  credentials: {
    hashingMethod: string;
    hash: string;
  };
}


const REF = 'auth.query-service';
const GLOBAL = false;
const DEPS = [Database.REF];

export class AuthQueryService implements Service {
  public static REF: string = REF;
  private db: Database;

  constructor(database: Database) {
    this.db = database;
  }


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


  public checkLogin_email(email: string, password: string): Promise<CheckLoginResponse> {
    const query = `
    SELECT * 
    FROM accounts INNER JOIN credentials ON (accounts.id = credentials.account_id)
    WHERE email = $1;`;

    return this.db.getClient()
      .query(query, [email])
      .then(this._mapCheckLoginResult);
  }


  public checkLogin_username(username: string, password: string): Promise<CheckLoginResponse> {
    const query = `
    SELECT * 
    FROM accounts INNER JOIN credentials ON (accounts.id = credentials.account_id)
    WHERE username = $1;`;

    return this.db.getClient()
      .query(query, [username])
      .then(this._mapCheckLoginResult);
  }


  private _mapCheckLoginResult(pgResult: QueryResult): CheckLoginResponse {
    if (pgResult.rows.length === 0) {
      return {
        empty: true
      };
    } else {
      const row = pgResult.rows[0];
      return {
        empty: false,
        account: {
          id: row.account_id,
          username: row.username,
          email: row.email
        },
        credentials: {
          hashingMethod: row.hashing_method,
          hash: row.hash
        }
      };
    }
  }
}


export const authQueryService: ServiceMetadata = {
  ref: REF,
  dependenciesRefs: DEPS,
  globalScope: GLOBAL,
  factory: AuthQueryService
};
