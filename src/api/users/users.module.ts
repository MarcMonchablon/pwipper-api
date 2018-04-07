import { Module, AbstractModule } from '../../core';

import { pweepsQueryService } from './_query/pweeps.query-service';
import { pweepService } from './_services/pweep.service';

import { pweepsRoute } from './pweeps/pweeps.route';


const MODULE_ID = 'users';

export function UserModule(parentModule: AbstractModule): Module {
  return new Module(
    MODULE_ID,
    parentModule,
    {
      subModules: [],
      services: [
        pweepsQueryService,
        pweepService
      ],
      routes: [
        pweepsRoute
      ]
    }
  );
}
