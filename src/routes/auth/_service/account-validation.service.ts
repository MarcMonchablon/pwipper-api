import { Service, ServiceMetadata } from '../../../core';


const REF = 'account-validation.service';
const GLOBAL = false;
const DEPS = [];

export class AccountValidationService implements Service {
  public ref: string = REF;
  constructor() {}


  public isEmail(emailOrUsername: string): boolean {
    return emailOrUsername.indexOf('@') !== -1;
  }


  public checkEmailMinLength(email: string): boolean { return email.length > 3; }
  public checkEmailMaxLength(email: string): boolean { return email.length < 100; }
  public checkEmailCharset(email: string): boolean { return email.indexOf('@') !== -1; }

  public checkUsernameMinLength(username: string): boolean { return username.length > 0; }
  public checkUsernameMaxLength(username: string): boolean { return username.length < 15; }

  // For now we only watch for space or @ in username;
  public checkUsernameCharset(username: string): boolean { return !/[\s|@]/.test(username); }
}


export const accountValidationService: ServiceMetadata = {
  ref: REF,
  dependenciesRefs: DEPS,
  globalScope: GLOBAL,
  factory: AccountValidationService
};
