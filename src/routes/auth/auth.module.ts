import { Module, ModuleFactory, AbstractModule, ServiceMetadata } from '../../core/module.model';

export function authModuleFactory(parentModule: AbstractModule): Module {
  const MODULE_ID = 'auth';

  // === SUB-MODULES ===================================================================


  // === SERVICES ======================================================================
  const authQueryService: ServiceMetadata = {
    ref: 'auth-query-service',
    dependenciesRefs: ['db'],
    globalScope: false,
    factory: () => 'Auth Query Service'
  };

  const accountValidationService: ServiceMetadata = {
    ref: 'account-validation-service',
    dependenciesRefs: [],
    globalScope: true,
    factory: () => 'Account Validation Service'
  };

  const credentialsService: ServiceMetadata = {
    ref: 'credentials-service',
    dependenciesRefs: [],
    globalScope: true,
    factory: () => 'Credentials Service'
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
