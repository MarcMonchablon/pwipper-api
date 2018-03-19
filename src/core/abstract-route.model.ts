
export interface RouteConstructor {
  new (...deps: any[]): AbstractRoute
}


export interface RouteMetadata {
  routePath: string;
  constructor: RouteConstructor
  dependenciesRefs: string[]
}


export type AbstractRoute = any; // TODO

