import { Module, AbstractModule } from '../../core';

import { authQueryService } from './_query/auth.query-service';
import { accountValidationService } from './_service/account-validation.service';
import { credentialsService } from './_service/credentials.service';
import { jwtService } from './_service/Jwt.service';
import { sessionService } from './_service/session.service';
import { sessionQueryService } from './_query/session.query-service';

import { loginRoute } from './login/login.route';
import { checkSessionRoute } from './check-session/check-session.route';
import { signUpRoute } from './sign-up/sign-up.route';


const MODULE_ID = 'auth';

export function AuthModule(parentModule: AbstractModule): Module {
  return new Module(
    MODULE_ID,
    parentModule,
    {
      subModules: [],
      services: [
        authQueryService,
        accountValidationService,
        credentialsService,
        jwtService,
        sessionService,
        sessionQueryService
      ],
      routes: [
        loginRoute,
        checkSessionRoute,
        signUpRoute
      ]
    });
}
