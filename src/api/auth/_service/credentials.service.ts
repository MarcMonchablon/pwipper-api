import { Service, ServiceMetadata } from '../../../core';


const REF = 'credentials.service';
const GLOBAL = true;
const DEPS = [];

export class CredentialsService implements Service {
  public static REF: string = REF;

  constructor() {}


  public passwordMatch(account: string, credentials: any, password: string): boolean {
    switch (credentials.hashingMethod) {
      case 'none':
        return credentials.hash === password;
        break;
      default:
        throw new Error(`Hashing method '${credentials.hashingMethod}' not supported`);
    }
  };
}


export const credentialsService: ServiceMetadata = {
  ref: REF,
  dependenciesRefs: DEPS,
  globalScope: GLOBAL,
  factory: CredentialsService
};
