import { Module, ModuleFactory, AbstractModule, ServiceMetadata } from '../../core/module.model';

import { AuthQueryService } from './_query/auth.query-service';
import { AccountValidationService } from './_service/account-validation.service';
import { CredentialsService } from './_service/credentials.service';


export function authModuleFactory(parentModule: AbstractModule): Module {
  const MODULE_ID = 'auth';

  // === SUB-MODULES ===================================================================


  // === SERVICES ======================================================================
  const authQueryService: ServiceMetadata = {
    ref: 'auth-query-service',
    dependenciesRefs: ['db'],
    globalScope: false,
    factory: AuthQueryService
  };

  const accountValidationService: ServiceMetadata = {
    ref: 'account-validation-service',
    dependenciesRefs: [],
    globalScope: true,
    factory: AccountValidationService
  };

  const credentialsService: ServiceMetadata = {
    ref: 'credentials-service',
    dependenciesRefs: [],
    globalScope: true,
    factory: CredentialsService
  };

  return new Module(
    MODULE_ID,
    [], [
      authQueryService,
      accountValidationService,
      credentialsService
    ],
    parentModule);
}
