import { EventEmitter } from 'events';
import * as _ from 'lodash';

import { AbstractModule } from './abstract-module.model';
import { Service, ServiceMetadata, ServiceConstructor } from './service.model';


interface ServiceConfig {
  id: string;
  ref: string;
  module: AbstractModule
  global: boolean;
  instance: Service
}

interface FactoryConfig {
  id: string;
  ref: string;
  module: AbstractModule,
  global: boolean,
  factory: ServiceConstructor;
  dependenciesRefs: string[];
  dependencies?: Array<{
    ref: string;
    id: string;
    resolved: boolean;
    instance: Service | null;
  }>;
}

interface DependencyConfig {
  id: string;
  ref: string;
  path: string[];
  global: boolean;
}

export interface ServiceByRef {
  [serviceRef: string]: Service
}


export class DependencyResolver {
  protected status$: EventEmitter;
  private services: ServiceConfig[];
  private factories: FactoryConfig[];
  private registeredModuleIds: string[];


  constructor(
    rootModule: AbstractModule,
    instantiatedServices: ServiceByRef
  ) {
    this.services = this.createServiceConfigFromInstances(instantiatedServices, rootModule);
    this.factories = [];
    this.registeredModuleIds = [];

    this.status$ = new EventEmitter();
    this.status$.on('error', (err) => {
      console.error('DependencyResolverService:: error thrown in status$ EventEmitter');
      throw err;
    });
  }


  public registerModuleServices(module: AbstractModule, servicesMetadata: ServiceMetadata[]): Promise<ServiceByRef> {
    if (this.registeredModuleIds.includes(module.id)) {
      throw new Error(`DependencyResolverService:: A module with id '${module.id}' has already been registered.`);
    }
    this.status$.emit('register-module', module.id, module.path, servicesMetadata);
    this.registeredModuleIds.push(module.id);

    const newFactories: FactoryConfig[] = servicesMetadata.map(s => this.createFactoryFromMetadata(s, module));
    this.factories = [...this.factories, ...newFactories];

    const servicesByRef$ = new Promise<ServiceByRef>( (resolve, reject) => {
      this.status$.once('services-instantiated', () => {
        try {
          const moduleServices = this.getModuleServices(module, this.services);
          resolve(moduleServices);
        } catch (err) {
          reject(err);
        }
      });
    });

    return servicesByRef$;
  }


  private getModuleServices(module: AbstractModule, services: ServiceConfig[]): ServiceByRef {
    const serviceByRef: ServiceByRef = {};

    const modulesServices = (module.isRoot) ?
      services.filter((s: ServiceConfig) => s.global || s.module.id === module.id) :
      services.filter((s: ServiceConfig) => !s.global && s.module.id === module.id);

    modulesServices.forEach((service: ServiceConfig) => {
      if (serviceByRef[service.ref]) { // Identicals refs within a module throw an error
        const conflictingServicesPath = modulesServices
          .filter((s: ServiceConfig) => s.ref === service.ref)
          .map((s: ServiceConfig) => s.module.path.join('/'));

        throw new Error(`DependencyResolverService::
                For '${module.id}' module, multiple services with same ref '${service.ref}' in same module.
                Conflicting services paths: [${conflictingServicesPath.join(', ')}].`);
      }

      serviceByRef[service.ref] = service.instance;
    });

    return serviceByRef;
  }


  private createServiceConfigFromInstances(services: ServiceByRef, rootModule: AbstractModule): ServiceConfig[] {
    const result: ServiceConfig[] = [];
    for (const ref in services) {
      result.push({
        id: this.makeId(ref, rootModule.path),
        ref: ref,
        module: rootModule,
        global: true,
        instance: services[ref]
      });
    }
    return result;
  }


  private createFactoryFromMetadata(metadata: ServiceMetadata, module: AbstractModule): FactoryConfig {
    return {
      id: this.makeId(metadata.ref, module.path),
      ref: metadata.ref,
      module: module,
      global: metadata.globalScope,
      factory: metadata.factory,
      dependenciesRefs: metadata.dependenciesRefs
    };
  }


  private makeId(ref: string, path: string[]): string {
    return path.join('/') + ':' + ref;
  }





  public resolveDependencies() {
    let factories: FactoryConfig[] = this.factories;
    let services: ServiceConfig[] = this.services;

    // === COMPUTE dependencies ids from refs ======
    this.computeDependencies(factories, services);

    // === SERVICE INSTANTIATION ===================
    let resolvableFactories: FactoryConfig[];
    let remainingFactories: FactoryConfig[];
    let newServices: ServiceConfig[];

    while (factories.length > 0) {
      this.updateDependencies(factories, services);

      // We find all factories that can be instantiated ...
      [resolvableFactories, remainingFactories] = this.partitionFactories(factories);
      if (resolvableFactories.length === 0) {
        throw this.createCyclicDependenciesError(remainingFactories);
      }

      // ... instantiate them ...
      newServices = this.instanciateServices(resolvableFactories);

      // ... and add them to services list.
      services = [...services, ...newServices];
      factories = remainingFactories;
    }

    // === FINISHED ! =========================
    this.factories = [];
    this.services = services;
    this.status$.emit('services-instantiated');
  }





  private computeDependencies(factories: FactoryConfig[], services: ServiceConfig[]): void {
    const deps = [...services, ...factories]
      .map((s: ServiceConfig | FactoryConfig): DependencyConfig => {
        return {
          id: s.id,
          ref: s.ref,
          path: s.module.path,
          global: s.global
        }
      });
    const groupedDeps = _.groupBy(deps, 'ref');

    factories.forEach((currentFactory: FactoryConfig) => {
      currentFactory.dependencies = currentFactory.dependenciesRefs
        .map((ref: string) => {
          const id = this.getDependencyId(ref, currentFactory, groupedDeps);
          return {
            ref: ref,
            id: id,
            resolved: false,
            instance: null
          };
        });
    });
  }


  /**
   * For each factory, set dependencies as resolved when they match one of the given services;
   * Leave non-matching dependencies unchanged.
   * This method mutate factories dependencies when they are resolved.
   *
   * @param factories
   * @param services
   */
  private updateDependencies(factories: FactoryConfig[], services: ServiceConfig[]): void {
    const servicesById = _.keyBy(services, 'id');
    factories.forEach((f: FactoryConfig) => {
      f.dependencies.forEach((dep) => {
        if (servicesById[dep.id]) {
          dep.instance = servicesById[dep.id].instance;
          dep.resolved = true;
        }
      });
    });
  }


  /**
   * Partition factories into a tuple of [resolvable, remaining] factories.
   * A factory is deemed resolvable when it has no unresolved dependencies (or no dependency at all).
   * If a factory still has unresolved dependencies, it goes into the 'remaining' bin.
   *
   * @param factories
   * @returns [resolvableFactories, remainingFactories]
   */
  private partitionFactories(factories: FactoryConfig[]): [FactoryConfig[], FactoryConfig[]] {
    const [resolvableFactories, remainingFactories] = _.partition(factories,
      (f: FactoryConfig) => _.every(f.dependencies, { resolved: true }) );
    return [resolvableFactories, remainingFactories];
  }


  /**
   * Take resolvable factories, instanciate them, and return them as a ServiceConfig Array.
   * If there is a dependencie somewhere without an instance, throw an error.
   *
   * @param factories       Factories corresponding to services to be instanciated
   * @returns services      Array of ServiceConfig corresponding to instanciated services
   */
  private instanciateServices(factories: FactoryConfig[]): ServiceConfig[] {
    return factories.map((f: FactoryConfig): ServiceConfig => {
      const deps = f.dependencies.map(d => {
        if (!d.resolved || d.instance === undefined || d.instance === null) {
          throw new Error(`DependencyResolver::
          Service factory '${f.id}' should have all dependencies resolved, yet ${d.id} isn't.`);
        }
        return d.instance;
      });
      return {
        id: f.id,
        ref: f.ref,
        module: f.module,
        global: f.global,
        instance: new f.factory(...deps)
      };
    });
  }




  /**
   * Return the id of the service that should be injected as dependency.
   * When multiple service match provided dependencyRef (service was shadowed somewhere in the module hierarchy),
   * return only the most relevant one, which is the one provided in the closest parent in hierarchy (or in the same module).
   *
   * @param dependencyRef         Reference of service to inject as dependency
   * @param factory               Factory asking for a dependency
   * @param groupedDependencies   Pre-computed dictionnary of ServiceFactory grouped by their reference
   *
   * @returns Id of service to be injected into factory
   */
  private getDependencyId(
    dependencyRef: string,
    factory: FactoryConfig,
    groupedDependencies: { [ref: string]: DependencyConfig[] }
  ): string {
    const potentialDeps = groupedDependencies[dependencyRef];
    if (!potentialDeps) {
      throw new Error(`DependencyResolverService::
          For '${factory.ref}' service in '${factory.module.id}' module,
          no reference of dependency '${dependencyRef}' was found.`);
    }

    if (potentialDeps.length === 1 && potentialDeps[0].id === factory.id) {
      throw new Error(`DependencyResolverService::
          For '${factory.ref}' service in '${factory.module.id}' module,
          the only reference for dependency '${dependencyRef}' is the service itself.`);
    }

    const matchingDeps = potentialDeps
    // Les dépendences doivent être dans le scope du service à injecter ...
      .filter((dep: DependencyConfig) => this.isDependencyInScope(factory.module.path, dep))
      // ... Et peuvent avoir le même ref, mais pas être le service en lui-même.
      .filter((dep: DependencyConfig) => dep.id !== factory.id);

    if (matchingDeps.length === 0) {
      throw new Error(`DependencyResolverService::
          For '${factory.ref}' service in '${factory.module.id}' module,
          potential matches for dependency '${dependencyRef}' were found, but they were all out of scope.`);
    }
    return this.getMostRelevantDep(matchingDeps).id;
  }


  /**
   * Return true if dependency is included in current path scope,
   * which is the case if any of these is true :
   *  - dependency has 'global' scope
   *  - dependency is defined in a parent path
   *  - dependency is defined in current path
   * */
  private isDependencyInScope(currentPath: string[], dependency: DependencyConfig): boolean {
    if (dependency.global) {
      // Globally-scoped service can be injected anywhere, so it's in the scope.
      return true;
    } else if (dependency.path.length > currentPath.length) {
      // Dependency is deeper in the hierarchy (and not global-scoped), thus cannot be in scope.
      return false;
    } else {
      // Return true only if dependency path is a parent or same as current path
      return dependency.path
        .every((pathSegment, i) => currentPath[i] === pathSegment);
    }
  }



  private getMostRelevantDep(factories: DependencyConfig[]): DependencyConfig {
    if (factories.length === 0) {
      throw new Error('DependencyResolver::getMostRelevantDep(): input array is empty (it shouldn\'t)');
    } else if (factories.length === 1) {
      return factories[0];
    } else {
      const globallyScoped = factories.filter(f => f.global);
      const locallyScoped = factories.filter(f => !f.global);
      const sortedLocallyScoped = _.sortBy(locallyScoped, [(f: DependencyConfig) => f.path.length]);
      const sortedFactories = [...globallyScoped, ...sortedLocallyScoped];
      // Take last item because we sorted from the least to the more specific/relevant factory.
      return _.last(sortedFactories);
    }
  }


  private createCyclicDependenciesError(factories: FactoryConfig[]): any {
    const cyclicDeps = this.findCyclicDependencies(factories);
    return new Error(`DependencyResolver::
          Service initialization impossible because of a cyclic dependency
          (${cyclicDeps.join(' -> ')}).`);
  }


  private findCyclicDependencies(factories: FactoryConfig[]): string[] {
    // TODO
    return [];
  }

}
