

// SERVICE STUFF
type Service = 'Service'; // TODO



interface ServiceMetadata {
  id: string;
  ref: string;
  dependenciesRefs: string[];
  globalScope: boolean;
  factory: (...deps: any[]) => Service;
}


// ABSTRACT MODULE STUFF
abstract class AbstractModule {
  public id: string;
  public path: string[];
  public dependencyResolver: DependencyResolver;

  constructor() {}

  // TODO
  

}


// MODULE STUFF

type ModuleFactory = (
  parentModule: AbstractModule
) => AbstractModule


export class Module extends AbstractModule {
  public id: string;
  public path: string[];
  public dependencyResolver: DependencyResolver;
  
  private parentModule: AbstractModule;
  private subModules: { [moduleId: string]: AbstractModule };
  private services: { [serviceRef: string]: Service };


  constructor(
    id: string,
    subModules: ModuleFactory[],
    services: ServiceMetadata[],
    parentModule: RootModule | Module
  ) {
    super();
    this.id = id;
    this.path = [...parentModule.path, id];
    this.dependencyResolver = parentModule.dependencyResolver;
    this.dependencyResolver.registerModuleServices(this.path, services)
      .then(); // TODO


  }
}



// DependencyResolver

export class DependencyResolver {
  private moduleServices: {
    path: string;
    servicesMetadata: ServiceMetadata[];
  }[];

  private services: {
    path: string;
    ref: string;
    instance: Service
  }[];

  
  constructor(
    rootModulePath: string[],
    instantiatedServices: { [serviceRef: string]: Service }
  ) {
    this.services = [];
    const rootModulePathStr = rootModulePath.join('/');
    for (const ref in instantiatedServices) {
      this.services.push({
	path: rootModulePathStr,
	ref: ref,
	instance: instantiatedServices[ref]
      });
    }
  }


  public registerModuleServices(
    modulePath: string[],
    moduleServicesMetadata: ServiceMetadata[]
  ): Promise<{ [serviceRef: string]: Service }> {
    

    // TODO: return instantiatedServices
    return null;
  }
  


  public doYourThing() {
   // TODO: start instantiating services 
  }
}



// ROOT MODULE STUFF (hérite de Module)




export type RootModuleFactory = (
  instantiatedServices: { [serviceRef: string]: Service }
) => RootModule;


export class RootModule extends AbstractModule {
  public id: string;
  public path: string[];
  public dependencyResolver: DependencyResolver;

  private subModules: { [moduleId: string]: AbstractModule };
  private services: { [serviceRef: string]: Service };
  

  
  constructor(
    id: string,
    subModules: ModuleFactory[],
    services: ServiceMetadata[],
    instantiatedServices: { [serviceRef: string]: Service }
  ) {
    super();
    this.id = id;
    this.path = [id];
    this.dependencyResolver = new DependencyResolver(this.path, instantiatedServices);

    this.dependencyResolver.registerModuleServices(this.path, services)
      .then(); // TODO

    this.subModules = {};
    subModules
      .map((moduleFactory: ModuleFactory) => moduleFactory(this))
      .forEach((module: AbstractModule) => this.subModules[module.id] = module);
    

    this.dependencyResolver.doYourThing();
  }

  private onInstantiatedServices(instantiatedServices: { [serviceRef: string]: Service }): void {
    console.log(`Services instantiated for module ${this.id}`);
    this.services = instantiatedServices;

    // Après, dans la promise
  }
  
  

}


