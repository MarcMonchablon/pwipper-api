
export interface ServiceMetadata {
  id: string;
  ref: string;
  dependenciesRefs: string[];
  globalScope: boolean;
  factory: (...deps: any[]) => Service;
}


export type Service = 'Service'; // TODO
