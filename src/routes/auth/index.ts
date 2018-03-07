import { RouteModule } from '../_models/route-module.model';
import { Database } from '../../database/database';

import { AuthQueryService } from './_query/auth.query-service';
import { AccountValidationService } from './_service/account-validation.service';
import { CredentialsService } from './_service/credentials.service';

import { LoginRoute } from './login/login.route';
import { SignUpRoute } from './sign-up/sign-up.route';


export function AuthModule(dbClient: Database): RouteModule {
  const authModule = new RouteModule('AuthModule');

  authModule.addService('authQueryService', new AuthQueryService(dbClient));
  authModule.addService('accountValidationService', new AccountValidationService());
  authModule.addService('credentialsService', new CredentialsService());

  authModule.addRoute(new LoginRoute(authModule));
  authModule.addRoute(new SignUpRoute(authModule));

  return authModule;
}
