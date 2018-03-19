import { EventEmitter } from 'events';
import { DependencyResolver } from './dependency-resolver.model';
import { Service } from './service.model';

export abstract class AbstractModule {
  public id: string;
  public path: string[];
  public isRoot: boolean;
  public status$: EventEmitter;
  public dependencyResolver: DependencyResolver;

  constructor() {}

  abstract getService(serviceRef: string, askingModuleId?: string): Service
}
