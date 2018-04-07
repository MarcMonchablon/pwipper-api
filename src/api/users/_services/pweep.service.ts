import { Service, ServiceMetadata } from '../../../core';


const REF =  'pweep.service';
const GLOBAL = false;
const DEPS = [];

export class PweepService implements Service {
  public static REF: string = REF;

  constructor() {}


  public checkContentSize(content: string): boolean { return content.length <= 140; }
}


export const pweepService: ServiceMetadata = {
  ref: REF,
  dependenciesRefs: DEPS,
  globalScope: GLOBAL,
  factory: PweepService
};
