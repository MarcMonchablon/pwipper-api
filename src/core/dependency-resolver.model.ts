import { Service, ServiceMetadata } from './service.model';


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
    this.moduleServices = [];

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

    this.moduleServices.push({
      path: modulePath.join('/'),
      servicesMetadata: moduleServicesMetadata
    });

    return new Promise<{ [serviceRef: string]: Service }>(
      (resolve, reject) => {
      //  console.log('into promise !');
        resolve({});
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
