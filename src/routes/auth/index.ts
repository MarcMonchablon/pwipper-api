import { RouteModule } from '../_models/route-module.model';

import { AuthQueryService } from './_query/auth.query-service';
import { AccountValidationService } from './_service/account-validation.service';
import { CredentialsService } from './_service/credentials.service';

import { LoginFn } from './login/login.route';
import { SignUpFn } from './sign-up/sign-up.route';


export function AuthModule(dbClient) {
  const authModule = new RouteModule('AuthModule');

  authModule.addService('authQueryService', new AuthQueryService(dbClient));
  authModule.addService('accountValidationService', new AccountValidationService());
  authModule.addService('credentialsService', new CredentialsService());

  authModule.addRoute(LoginFn);
  authModule.addRoute(SignUpFn);

  return authModule;
}
