
export interface ServiceConstructor {
  new (...deps: any[]): Service
}


export interface ServiceMetadata {
  ref: string;
  dependenciesRefs: string[];
  globalScope: boolean;
  factory: ServiceConstructor;
}


export type Service = any; // TODO

// TODO: Change 'Service' to 'Injectable',
// and change type Injectable to contain a value 'INJECTABLE_REF: string'.
// Un service qui peut dépendre de trucs à injecter peut-être appelé un dependable ?
// Plug / pluggable ?