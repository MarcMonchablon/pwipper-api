import { Module, AbstractModule } from '../../core';

import { usersQueryService } from './_query/users.query-service';
import { pweepsQueryService } from './_query/pweeps.query-service';
import { pweepService } from './_services/pweep.service';

import { userListRoute } from './user-list/user-list.route';
import { userRoute } from './user/user.route';
import { userByNameRoute } from './user-by-name/user-by-name.route';
import { pweepListRoute } from './pweep-list/pweep-list.route';


const MODULE_ID = 'user-list';

export function UserModule(parentModule: AbstractModule): Module {
  return new Module(
    MODULE_ID,
    parentModule,
    {
      subModules: [],
      services: [
        usersQueryService,
        pweepsQueryService,
        pweepService
      ],
      routes: [
        userListRoute,
        userRoute,
        userByNameRoute,
        pweepListRoute
      ]
    }
  );
}
