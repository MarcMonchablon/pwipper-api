import { Module, ModuleFactory, AbstractModule, ServiceMetadata } from '../../core/module.model';

import { AuthQueryService } from './_query/auth.query-service';
import { AccountValidationService } from './_service/account-validation.service';
import { CredentialsService } from './_service/credentials.service';
import {RouteMetadata} from '../../core/abstract-route.model';


export function authModuleFactory(parentModule: AbstractModule): Module {
  const MODULE_ID = 'auth';

  // === SUB-MODULES ===================================================================
  const declaredSubModules: ModuleFactory[] = [];


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

  const declaredServices: ServiceMetadata[] = [
    authQueryService,
    accountValidationService,
    credentialsService
  ];


  // === ROUTES ========================================================================
  const declaredRoutes: RouteMetadata[] = [];


  return new Module(
    MODULE_ID,
    parentModule,
    {
      subModules: declaredSubModules,
      services: declaredServices,
      routes: declaredRoutes
    });
}
