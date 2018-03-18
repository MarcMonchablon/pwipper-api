import { DependencyResolver } from './dependency-resolver.model';

export abstract class AbstractModule {
  public id: string;
  public path: string[];
  public dependencyResolver: DependencyResolver;
  public isRoot: boolean;

  constructor() {}

  // TODO


}
