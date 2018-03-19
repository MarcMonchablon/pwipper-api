
export interface RouteConstructor {
  new (...deps: any[]): AbstractRoute
}


export interface RouteMetadata {
  routePath: string;
  constructor: RouteConstructor
  dependenciesRefs: string[]
}


export abstract class AbstractRoute {
  public path: string;
  constructor(path: string) { this.path = path; }
  public abstract registerRoute(server: any): void
}
