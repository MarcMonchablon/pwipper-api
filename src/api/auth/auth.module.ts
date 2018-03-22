import { Module, AbstractModule } from '../../core';

import { authQueryService } from './_query/auth.query-service';
import { accountValidationService } from './_service/account-validation.service';
import { credentialsService } from './_service/credentials.service';

import { loginRoute } from './login/login.route';
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
        credentialsService
      ],
      routes: [
        loginRoute,
        signUpRoute
      ]
    });
}
