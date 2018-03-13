
export interface ServiceMetadata {
  ref: string;
  dependenciesRefs: string[];
  globalScope: boolean;
  factory: (...deps: any[]) => Service;
}


export type Service = any; // TODO
