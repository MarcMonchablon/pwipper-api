import { EventEmitter } from 'events';
import { AbstractModule } from './abstract-module.model';
import { Service, ServiceMetadata } from './service.model';



interface ModuleObj {
  path: string;
  servicesMetadata: ServiceMetadata[];
}


interface ServiceObj {
  parentModuleId: string,
  path: string;
  ref: string;
  isGlobal: boolean;
  instance: Service
}


export interface InstantiatedServices {
  [serviceRef: string]: Service
}


export class DependencyResolver {
  protected status$: EventEmitter;
  private moduleServices: ModuleObj[];
  private services: ServiceObj[];


  constructor(
    rootModule: AbstractModule,
    instantiatedServices: InstantiatedServices
  ) {
    this.services = [];
    this.moduleServices = [];
    this.status$ = new EventEmitter();

    for (const ref in instantiatedServices) {
      this.services.push({
        parentModuleId: rootModule.id,
        path: rootModule.path.join('/'),
        ref: ref,
        isGlobal: true,
        instance: instantiatedServices[ref]
      });
    }

    this.status$.on('error', (err) => {
      console.error('DependencyResolverService:: error thrown in status$ EventEmitter');
      throw err;
    });
  }


  public registerModuleServices(
    module: AbstractModule,
    moduleServicesMetadata: ServiceMetadata[]
  ): Promise<InstantiatedServices> {
    this.status$.emit('register-module', module.id, module.path, moduleServicesMetadata);

    this.moduleServices.push({
      path: module.path.join('/'),
      servicesMetadata: moduleServicesMetadata
    });

    return new Promise<InstantiatedServices>(
      (resolve, reject) => {
        this.status$.once('services-instantiated', () => {
          const instantiatedServices: InstantiatedServices = {};

          const modulesServices = (module.isRoot) ?
            this.services.filter((s: ServiceObj) => s.isGlobal || s.parentModuleId === module.id) :
            this.services.filter((s: ServiceObj) => !s.isGlobal && s.parentModuleId === module.id);

          modulesServices.forEach((service: ServiceObj) => {
            if (!instantiatedServices[service.ref]) {
              instantiatedServices[service.ref] = service.instance;
            } else {
              // Error: We cannot have with identicals refs within a module.
              const conflictingServicesPath = modulesServices
                .filter((s: ServiceObj) => s.ref === service.ref)
                .map((s: ServiceObj) => s.path);
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



  public doYourThing() {
    console.log('========================================');
    console.log('DependencyResolver::doYourThing()');
    console.log('services: ', this.services);
    console.log('moduleServices: ', this.moduleServices);
    console.log('========================================');

    // TODO: start instantiating services

  }
}


/** TODO :
 * - Don't bother with Injector for now. Modules and RootModule do that stuff.
 * - Return correct services in registerModuleServices promises. (maybe use an EventEmitter to trigger stuff in promise inner function ??)
 */
