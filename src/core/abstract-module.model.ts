import { DependencyResolver } from './dependency-resolver.model';
import { Service } from './service.model';

export abstract class AbstractModule {
  public id: string;
  public path: string[];
  public dependencyResolver: DependencyResolver;
  public isRoot: boolean;

  constructor() {}

  abstract getService(serviceRef: string, askingModuleId?: string): Service
}
