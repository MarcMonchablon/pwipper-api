import { EventEmitter } from 'events';
import * as _ from 'lodash';

import { AbstractModule } from './abstract-module.model';
import { Service, ServiceMetadata, ServiceConstructor } from './service.model';


export interface InstantiatedServices {
  [serviceRef: string]: Service
}


interface ModuleObj {
  id: string;
  path: string[];
  servicesMetadata: ServiceMetadata[];
}


interface ServiceObj {
  id: string;
  ref: string;
  module: AbstractModule
  global: boolean;
  instance: Service
}


interface FactoryObj {
  id: string;
  ref: string;
  module: AbstractModule,
  global: boolean,
  factory: ServiceConstructor;
  dependenciesRefs: string[];
  unresolvedDependenciesId?: string[];
  resolvedDependenciesId?: string[];
}

interface DependencyObj {
  id: string;
  ref: string;
  path: string[];
  global: boolean;
}



export class DependencyResolver {
  protected status$: EventEmitter;
  private moduleServices: ModuleObj[];
  private services: ServiceObj[];
  private instantiatedServices: ServiceObj[];
  private factories: FactoryObj[];


  constructor(
    rootModule: AbstractModule,
    instantiatedServices: InstantiatedServices
  ) {
    this.moduleServices = [];
    this.instantiatedServices = this.toServiceObjArray(instantiatedServices, rootModule);
    this.services = [...this.instantiatedServices];
    this.factories = [];
    this.status$ = new EventEmitter();


    this.status$.on('error', (err) => {
      console.error('DependencyResolverService:: error thrown in status$ EventEmitter');
      throw err;
    });
  }


  public registerModuleServices(
    module: AbstractModule,
    moduleServicesMetadata: ServiceMetadata[]
  ): Promise<InstantiatedServices> {
    // TODO: Check for module id uniqueness here.
    this.status$.emit('register-module', module.id, module.path, moduleServicesMetadata);

    const newFactories: FactoryObj[] = moduleServicesMetadata
      .map((serviceMetadata: ServiceMetadata) => {
        return {
          id: this.makeId(serviceMetadata.ref, module.path),
          ref: serviceMetadata.ref,
          module: module,
          global: serviceMetadata.globalScope,
          factory: serviceMetadata.factory,
          dependenciesRefs: serviceMetadata.dependenciesRefs
        };
      });
    this.factories = [...this.factories, ...newFactories];

    return new Promise<InstantiatedServices>(
      (resolve, reject) => {
        this.status$.once('services-instantiated', () => {
          const instantiatedServices: InstantiatedServices = {};

          const modulesServices = (module.isRoot) ?
            this.services.filter((s: ServiceObj) => s.global || s.module.id === module.id) :
            this.services.filter((s: ServiceObj) => !s.global && s.module.id === module.id);

          modulesServices.forEach((service: ServiceObj) => {
            if (!instantiatedServices[service.ref]) {
              instantiatedServices[service.ref] = service.instance;
            } else {
              // Error: We cannot have with identicals refs within a module.
              const conflictingServicesPath = modulesServices
                .filter((s: ServiceObj) => s.ref === service.ref)
                .map((s: ServiceObj) => s.module.path.join('/'));
              const error = new Error(`DependencyResolverService::
                For '${module.id}' module, multiple services with same ref '${service.ref}' in same module.
              Conflicting services paths: [${conflictingServicesPath.join(', ')}].`);
              reject(error);
            }
          });

          resolve(instantiatedServices);
        });
      });
  }


  private toServiceObjArray(services: InstantiatedServices, rootModule: AbstractModule): ServiceObj[] {
    const result: ServiceObj[] = [];
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


  private makeId(ref: string, path: string[]): string {
    return path.join('/') + ':' + ref;
  }





  public doYourThing() {
    // === COMPUTE dependencies ids from refs ======
    const deps = [...this.instantiatedServices, ...this.factories]
      .map((s: ServiceObj | FactoryObj): DependencyObj => {
        return {
          id: s.id,
          ref: s.ref,
          path: s.module.path,
          global: s.global
        }
      });
    const groupedDeps = _.groupBy(deps, 'ref');

    this.factories.forEach((currentFactory: FactoryObj) => {
      const dependenciesId = currentFactory.dependenciesRefs
        .map((ref: string) => this.getDependencyId(ref, currentFactory, groupedDeps));

      const [resolved, unresolved]: [string[], string[]] = _.partition(dependenciesId,
        (id: string) => this.instantiatedServices.some((s: ServiceObj) => s.id === id));
      currentFactory.resolvedDependenciesId = resolved;
      currentFactory.unresolvedDependenciesId = unresolved;
    });


    // === SERVICE INSTANTIATION ===================
    let resolvableFactories: FactoryObj[];
    let remainingFactories: FactoryObj[];
    let newServices: ServiceObj[];

    while (
      this.factories.length > 0 &&
      this.factories.filter(f => f.unresolvedDependenciesId.length === 0)
      ) {
      // We find all services that can be instantiated ...
      [resolvableFactories, remainingFactories] = _.partition(this.factories, (f: FactoryObj) => f.unresolvedDependenciesId.length === 0);
      if (resolvableFactories.length === 0) {
        const cyclicDeps = this.findCyclicDependencies(remainingFactories);
        throw new Error(`DependencyResolver::
          Service initialization impossible because of a cyclic dependency
          (${cyclicDeps.join(' -> ')}).`);
      }

      // ... instantiate them ...
      newServices = resolvableFactories.map((f: FactoryObj): ServiceObj => {
        const deps = f.resolvedDependenciesId.map(
          (depId: string) => this.instantiatedServices
            .find((s: ServiceObj) => s.id === depId)
            .instance
        );
        return {
          id: f.id,
          ref: f.ref,
          module: f.module,
          global: f.global,
          instance: new f.factory(...deps)
        };
      });

      // ... add them to this.services ...
      this.services = [...this.services, ...newServices];

      // ... then remove their ids from remaining services unresolvedDeps list ...
      const newServicesId = newServices.map((s: ServiceObj) => s.id);
      remainingFactories.forEach((f: FactoryObj) => {
        const unresolved = f.unresolvedDependenciesId
          .filter((dep: string) => !newServicesId.includes(dep));
        f.unresolvedDependenciesId = unresolved;
      });

      // ... and remove them from the main serviceFactory list.
      this.factories = remainingFactories;
    }

    // === FINISHED ! =========================
    this.status$.emit('services-instantiated');
  }



  private findCyclicDependencies(factories: FactoryObj[]): string[] {
    // TODO
    return [];
  }



  /**
   * Return the id of the service that should be injected as dependency.
   * When multiple service match provided dependencyRef (service was shadowed somewhere in the module hierarchy),
   * return only the most relevant one, which is the one provided in the closest parent in hierarchy (or in the same module).
   *
   * @param dependencyRef         Reference of service to inject as dependency
   * @param factory               Factory asking for a dependency
   * @param groupedDependencies:  Pre-computed dictionnary of ServiceFactory grouped by their reference
   *
   * @returns Id of service to be injected into factory
   */
  private getDependencyId(
    dependencyRef: string,
    factory: FactoryObj,
    groupedDependencies: { [ref: string]: DependencyObj[] }
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
      .filter((dep: DependencyObj) => this.isDependencyInScope(factory.module.path, dep))
      // ... Et peuvent avoir le même ref, mais pas être le service en lui-même.
      .filter((dep: DependencyObj) => dep.id !== factory.id);

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
  private isDependencyInScope(currentPath: string[], dependency: DependencyObj): boolean {
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


  private getMostRelevantDep(factories: DependencyObj[]): DependencyObj {
    if (factories.length === 0) {
      throw new Error('DependencyResolver::getMostRelevantDep(): input array is empty (it shouldn\'t)');
    } else if (factories.length === 1) {
      return factories[0];
    } else {
      const globallyScoped = factories.filter(f => f.global);
      const locallyScoped = factories.filter(f => !f.global);
      const sortedLocallyScoped = _.sortBy(locallyScoped, [(f: DependencyObj) => f.path.length]);
      const sortedFactories = [...globallyScoped, ...sortedLocallyScoped];
      // Take last item because we sorted from the least to the more specific/relevant factory.
      return _.last(sortedFactories);
    }
  }



}
