import { Next, Request, RequestHandler, Response } from 'restify';
import * as errs from 'restify-errors';
import { Service, ServiceMetadata } from '../../../core';

import { SessionService, LoginData } from '../_service/session.service';



export const USER_DATA_KEY = 'user-data';
export { LoginData as UserData } from '../_service/session.service';


export const REF = 'auth.middleware';
const GLOBAL = true;
const DEPS = [
  SessionService.REF
];

export class AuthMiddleware implements Service {
  public static REF: string = REF;

  constructor(
    private sessionService: SessionService
  ) {}


  /**
   * Create a middleware to check user credentials
   *
   * Check JWT present in 'Authorization' header,
   * add in request[USER_DATA_KEY] data as a UserData object if logged, null otherwise,
   * pass to next middleware in everycase if 'authMandatory' is set to false,
   * an only when credentials are valid otherwise (return HTTP 401 (not authorized) when credentials are invalid).
   *
   * @param authMandatory       If true, return 401 (not authorized) when credentials are invalid (default: true)
   *
   * @returns A RequestHandler that either add user data in request or throw a 401 (not authorized) error
   * */
  public checkAuthorization(authMandatory: boolean = true): RequestHandler {
    const sessionService = this.sessionService;

    return function(req: Request, res: Response, next: Next): void {
      const bearerToken = req.headers['authorization'];
      if (!bearerToken || typeof bearerToken !== 'string') {
        if (authMandatory) {
          next(new errs.NotAuthorizedError('No bearer token found'));
        } else {
          req[USER_DATA_KEY] = null;
          next();
        }
        return;
      }

      sessionService.checkSession(bearerToken)
        .then((loginData: LoginData | null) => {
          if (loginData === null && authMandatory) {
            next(new errs.NotAuthorizedError('Bearer token not valid'));
            return;
          } else {
            req[USER_DATA_KEY] = loginData;
            next();
          }
        }).catch(e => {
        console.error('CheckSession: Something unexpected happened : ', e);
        next(new errs.InternalServerError(e));
      });
    }
  }
}


export const authMiddleware: ServiceMetadata = {
  ref: REF,
  globalScope: GLOBAL,
  dependenciesRefs: DEPS,
  factory: AuthMiddleware
};
