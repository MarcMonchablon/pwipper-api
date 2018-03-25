import * as _ from 'lodash';
import { RequestHandler, Request, Response, Next } from 'restify';
import * as errs from 'restify-errors';

import { Service, ServiceMetadata } from '../../core';
// TODO : Créer un dossier @app/server,
// qui englobe toute cette logique Restify, et exporte les trucs utilises.


export const REF = 'middleware.service';
const GLOBAL = true;
const DEPS = [];

export class MiddlewareService implements Service {
  public ref: string = REF;

  constructor() {}


  /**
   * Create a middleware to check the existence of fields in a request' body.
   *
   * Take a list of mandatory and optional fields in HTTP POST body
   * Return a RequestHandler that can potentially return HTTP status 412:PreconditionFailed
   * We return following error codes :
   *  'MISSING_PAYLOAD': if body is missing and mandatoryFields isn't empty
   *  'MISSING_FIELD': if at least one field is missing
   *  'UNKNOWN_FIELD': if throwOnUnknownField is true and at least one field isn't in either list.
   * If none of those condition is met, we do nothing and pass the bucket.
   *
   * @param mandatoryFields       list of mandatory keys in body
   * @param optionalFields        list of optional keys in body
   * @param throwOnUnknownField   set to true to also throw 'UNKNOWN_FIELD' code on unrecognized key in body (default: false)
   *
   * @returns A RequestHandler that either do nothing or throw an error
   * */
  public checkBodyFields(
    mandatoryFields: string[] = [],
    optionalFields: string[] = [],
    throwOnUnknownField: boolean = true
  ): RequestHandler {

    return function(req: Request, res: Response, next: Next) {
      let error = null;

      // 'MISSING_PAYLOAD' checks
      if (!req.body && mandatoryFields.length > 0) {
        error = {
          code: 'MISSING_PAYLOAD',
          message: 'Payload is missing.'
        };
      }

      // 'MISSING_FIELD' checks
      const missingFields = mandatoryFields.filter(field => req.body[field] === undefined);
      if (!error && missingFields.length > 0) {
        error = {
          code: 'MISSING_FIELD',
          message: `Payload is missing ${MiddlewareService.computeFieldsAsSentence(missingFields)}.`,
          detail: missingFields
        };
      }

      // 'UNKNOWN_FIELD' checks
      if (!error && throwOnUnknownField) {
        const unknownFields = _.chain(req.body)
          .toPairs()
          .map(pair => pair[0])
          .difference(mandatoryFields)
          .difference(optionalFields)
          .value();
        if (unknownFields.length > 0) {
          error = {
            code: 'UNKNOWN_FIELD',
            message: `Payload has unknown ${MiddlewareService.computeFieldsAsSentence(unknownFields)}.`,
            detail: unknownFields
          }
        }
      }

      // All checks done, send response
      if (error) {
        return next(new errs.PreconditionFailedError(error));
      } else {
        next();
      }
    }
  }


  public static computeFieldsAsSentence(missingFields: string[]): string {
    if (!missingFields || missingFields.length === 0) {
      throw new Error(`[${REF}]:computeListAsSentence:  Expected non-empty list as arguments, got ${missingFields} instead.`);
    } else if (missingFields.length === 1) {
      return `field '${missingFields[0]}'`;
    } else {
      return `fields '${_.dropRight(missingFields, 1).join("', '")} and '${_.last(missingFields)}'`;
    }
  }
}


export const middlewareService: ServiceMetadata = {
  ref: REF,
  globalScope: GLOBAL,
  dependenciesRefs: DEPS,
  factory: MiddlewareService
};
