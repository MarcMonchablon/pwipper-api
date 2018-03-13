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
