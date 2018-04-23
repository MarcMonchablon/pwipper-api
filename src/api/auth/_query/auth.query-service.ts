import { QueryResult } from 'pg';
import { Service, ServiceMetadata } from '../../../core';

import { Database } from '../../../db';
import { JwtService } from '../_service/Jwt.service';

import { FullUserData } from '../../users/_models/full-user-data.model';


export type CheckLoginResponse = CheckLoginResponse_Success | CheckLoginResponse_Fail;
export interface CheckLoginResponse_Fail { empty: true; }
export interface CheckLoginResponse_Success {
  empty: false;
  token: string;
  account: FullUserData;
  credentials: {
    hashingMethod: string;
    hash: string;
  };
}


const REF = 'auth.query-service';
const GLOBAL = false;
const DEPS = [
  Database.REF,
  JwtService.REF
];

export class AuthQueryService implements Service {
  public static REF: string = REF;

  constructor(
    private db: Database,
    private jwt: JwtService
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

    const self = this;
    return this.db.getClient()
      .query(query, [username])
      .then(this._mapCheckLoginResult);
  }


  private _mapCheckLoginResult = (pgResult: QueryResult): CheckLoginResponse => {
    if (pgResult.rows.length === 0) {
      return {
        empty: true
      };
    } else {
      const row = pgResult.rows[0];
      const token = this.createToken(row.account_id, row.latest_token_reset);
      return {
        empty: false,
        token: token,
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

  private createToken(userId: string, latestTokenReset: string): string {
    return this.jwt.createToken({
      userId: userId,
      latestReset: latestTokenReset
    });
  }
}


export const authQueryService: ServiceMetadata = {
  ref: REF,
  dependenciesRefs: DEPS,
  globalScope: GLOBAL,
  factory: AuthQueryService
};
