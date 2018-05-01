import { Service, ServiceMetadata } from '../../../core';

import { JwtService, JwtCheckResponse } from './Jwt.service';
import { AuthQueryService, LoginData as RawLoginData } from '../_query/auth.query-service';
import { SessionQueryService } from '../_query/session.query-service';
import {FullUserData} from '../../users/_models/full-user-data.model';


interface SessionData {
  userId: string;
  latestReset: string;
}

/*type SessionStoreItem = SessionStoreItem__Loading | SessionStoreItem__Logged | SessionStoreItem__NotLogged | SessionStoreItem__Error;
interface SessionStoreItem__Loading     { status: 'loading'; promise: any; }
interface SessionStoreItem__Logged      { status: 'logged'; sessionData: SessionData; }
interface SessionStoreItem__NotLogged   { status: 'not-logged'; sessionData: SessionData; }
interface SessionStoreItem__Error       { status: 'error'; err: any }*/

type UserId = string;

type SessionStoreItem_old =
 | { status: 'loading'; promise: any; }
 | { status: 'logged'; sessionData: SessionData; account: any; }
 | { status: 'not-logged'; sessionData: SessionData; }
 | { status: 'error'; err: any };

type SessionStoreItem = {
  sessionData: SessionData,
  promise: Promise<UserId | null>;
}


export interface LoginData {
  token: string;
  account: FullUserData;
}


const REF = 'session.service';
const GLOBAL = false;
const DEPS = [
  JwtService.REF,
  AuthQueryService.REF,
  SessionQueryService.REF
];

export class SessionService implements Service {
  public static REF: string = REF;
  private sessions: { [userId: string]: SessionStoreItem };

  constructor(
    private jwt: JwtService,
    private authQuery: AuthQueryService,
    private sessionQuery: SessionQueryService
  ) {
    this.sessions = {};
  }


  public login(emailOrUsername: string, password: string, loginByEmail: boolean): Promise<LoginData | null> {
    const login$ = loginByEmail ?
      this.authQuery.checkLogin_email(emailOrUsername, password) :
      this.authQuery.checkLogin_username(emailOrUsername, password);

    return login$
      .then((loginData: RawLoginData | null) => {
        if (loginData === null) {
          return null;
        } else {
          const sessionData = loginData.session;
          const token = this.createToken(sessionData);
          return {
            token: token,
            account: loginData.account
          };
        }
      })
  }


  public checkSession(bearerToken: string): Promise<LoginData | null> {
    const tokenData = this.parseToken(bearerToken);
    if (tokenData === null) {
      return Promise.resolve(null);
    }

    return this.authQuery
      .checkSession(tokenData.userId, tokenData.latestReset)
      .then((loginData: RawLoginData | null) => {
        if (loginData === null) {
          return null;
        } else {
          return {
            token: bearerToken,
            account: loginData.account
          };
        }
      })
  }



  public checkToken(token: string): Promise<UserId | null> {
    // TODO: appeler cette fonction dans un middleware de connection.
    const payload = this.parseToken(token);
    if (!payload) { return Promise.reject('No token or no valid payload found'); }

    let session = this.sessions[payload.userId];
    if (!session) {
      const promise = this.sessionQuery.checkSession(payload.userId, payload.latestReset);
      session = { sessionData: payload, promise: promise };
      this.sessions[payload.userId] = session;
    }
    return session.promise;
    // TODO: utiliser le latestReset pour filtrer le store.
    // TODO: plutôt qu'indexer avec l'userId, indexer avec le token ?
  }


  private createToken(data: SessionData): string {
    return this.jwt.createToken({
      userId: data.userId,
      latestReset: data.latestReset
    });
  }

  private parseToken(bearerToken: string): SessionData | null {
    const parsedToken = this.jwt.checkBearer(bearerToken);
    if (!parsedToken.ok) { return null; }
    const payload = parsedToken.data;
    if (!payload || !payload['userId'] || !payload['latestReset']) { return null; }
    return {
      userId: payload.userId,
      latestReset: payload.latestReset
    };
  }




}


export const sessionService: ServiceMetadata = {
  ref: REF,
  dependenciesRefs: DEPS,
  globalScope: GLOBAL,
  factory: SessionService
};
