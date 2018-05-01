import { Service, ServiceMetadata } from '../../../core';

import { JwtService, JwtCheckResponse } from './Jwt.service';
import { AuthQueryService, LoginData as RawLoginData } from '../_query/auth.query-service';
import { FullUserData } from '../../users/_models/full-user-data.model';
import { Cache } from '../../../_models/cache.model';


interface SessionData {
  userId: string;
  latestReset: string;
}

export interface LoginData {
  token: string;
  account: FullUserData;
}


const REF = 'session.service';
const GLOBAL = false;
const DEPS = [
  JwtService.REF,
  AuthQueryService.REF
];

export class SessionService implements Service {
  public static REF: string = REF;
  private sessions: Cache<Promise<LoginData | null>>;

  constructor(
    private jwt: JwtService,
    private authQuery: AuthQueryService
  ) {
    this.sessions = new Cache<Promise<LoginData | null>>();
  }


  public login(emailOrUsername: string, password: string, loginByEmail: boolean): Promise<LoginData | null> {
    const login$ = loginByEmail ?
      this.authQuery.checkLogin_email(emailOrUsername, password) :
      this.authQuery.checkLogin_username(emailOrUsername, password);

    return login$
      .then((data: RawLoginData | null) => {
        if (data === null) {
          return null;
        } else {
          const sessionData = data.session;
          const token = this.createToken(sessionData);
          const loginData: LoginData = { token: token, account: data.account };
          this.sessions.save(Promise.resolve(loginData), token);
          return loginData;
        }
      })
  }


  public checkSession(bearerToken: string): Promise<LoginData | null> {
    const savedSession = this.sessions.find(bearerToken);
    if (savedSession) { return savedSession; }

    const tokenData = this.parseToken(bearerToken);
    if (tokenData === null) {
      return Promise.resolve(null);
    }

    const session$ = this.authQuery
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
      });
    this.sessions.save(session$, bearerToken);
    return session$;
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
