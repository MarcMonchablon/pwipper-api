import * as jwt from 'jsonwebtoken';
import { Service, ServiceMetadata } from '../../../core';


export type JwtCheckResponse = JwtCheckSuccessResponse | JwtCheckErrorResponse;
export interface JwtCheckSuccessResponse { ok: true; data: any; }
export interface JwtCheckErrorResponse { ok: false; err: any; }


const SECRET = require('../../../../env/jwt-private-key.secret.js').secret;

const REF = 'jwt.service';
const GLOBAL = false;
const DEPS = [];

export class JwtService implements Service {
  public static REF: string = REF;
  private algorithm: string;
  private secret: string;


  constructor() {
    this.algorithm = 'HS256';
    this.secret = SECRET;
  }


  public createToken(payload: any): string {
    return jwt.sign(payload, this.secret, { algorithm: this.algorithm });
  }


  public checkBearer(bearerToken: string): JwtCheckResponse {
    const bearer = bearerToken.substring(0, 7);
    if (bearer === 'Bearer ') {
      const token = bearerToken.substring(7);
      return this.checkToken(token);
    } else {
      return {
        ok: false,
        err: new Error(`Expected a Bearer token, got '${bearerToken}' instead.`)
      };
    }
  }


  public checkToken(token: string): JwtCheckResponse {
    try {
      const payload = jwt.verify(token, this.secret, { algorithms: [this.algorithm] });
      return {
        ok: true,
        data: payload
      }
    } catch (err) {
      return {
        ok: false,
        err: err
      }
    }
  }
}


export const jwtService: ServiceMetadata = {
  ref: REF,
  dependenciesRefs: DEPS,
  globalScope: GLOBAL,
  factory: JwtService
};
