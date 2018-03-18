
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
