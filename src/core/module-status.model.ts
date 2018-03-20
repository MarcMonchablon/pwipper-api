import { EventEmitter } from 'events';

const STATUS_ORDER: string[] = [
  'module-created',
  'module-ready-for-init',
  'instantiating-submodules',
  'submodules-instantiated',
  'registering-services',
  'services-registered',
  'ready-to-resolve-dependency',
  'resolving-dependencies',
  'dependencies-resolved',
  'services-instantiated',
  'ready-for-routes-instantiation',
  'instantiating-routes',
  'routes-instantiated',
  'ready-for-routes-activations',
  'activating-routes',
  'routes-activated',
  'all-good'
];


interface ModuleInterface {
  id: string;
  status$: ModuleStatus;
}


export class ModuleStatus {
  private id: string;
  private current: string;
  private verbose: boolean;
  private status$: EventEmitter;


  constructor(
    moduleId: string,
    verbose?: boolean
  ) {
    this.id = moduleId;
    this.verbose = !!verbose;
    this.status$ = new EventEmitter();
    this.status$.on('error', (err) => {
      console.error(`[MODULE '${this.id}']: `, err);
      throw err;
    })
  }


  public emit(newStatus: string): void {
    if (this.current === 'all-good') {
      throw new Error(`In module '${this.id}', cannot change status to '${newStatus}':
      module has already finished intializing stuff (currentStatus: 'all-good')`);
    }

    if (!STATUS_ORDER.includes(newStatus)) {
      throw new Error(`In module '${this.id}', cannot change status to '${newStatus}'.
      (possible values: [${STATUS_ORDER.join(', ')}]).`);
    }

    const currentIndex = this.index(this.current);
    const statusIndex = this.index(newStatus);
    if (statusIndex <= currentIndex) {
      const possibleValues = STATUS_ORDER.slice(currentIndex);
      throw new Error(`In module '${this.id}', cannot change status back to '${newStatus}'.
      (possible values: [${possibleValues.join(', ')}]).`);
    }

    if (this.verbose) {
      console.log(`[MODULE '${this.id}'] status changed to '${newStatus}' (was '${this.current}').`)
    }
    this.current = newStatus;
    this.status$.emit('status-change', newStatus);
  }


  public on(status: string): Promise<true> {
    const currentIndex = this.index(this.current);
    const statusIndex = this.index(status);

    if (statusIndex <= currentIndex) {
      return new Promise<true>((resolve, reject) => resolve(true));
    } else {
      return new Promise<true>((resolve, reject) => {
        this.status$.on('status-change',
          (emittedStatus) => {
            if (emittedStatus === status) { resolve(true); }
          });
      });
    }
  }


  public registerChildModules(modules: ModuleInterface[]): void {
    // TODO: itérer sur des concepts de précondition / results, ou bien moduleCondition, subModuleCondition, result ?
    if (modules.length === 0) {
      this.on('services-registered').then(() => this.emit('ready-to-resolve-dependency'));
      this.on('services-instantiated').then(() => this.emit('ready-for-routes-instantiation'));
      this.on('routes-instantiated').then(() => this.emit('ready-for-routes-activations'));
      this.on('routes-activated').then(()    => this.emit('all-good'));
    } else {
      Promise.all([
        this.on('services-registered'),
        ...modules.map((m: ModuleInterface) => m.status$.on('ready-to-resolve-dependency'))
      ]).then(() => this.emit('ready-to-resolve-dependency'));

      Promise.all([
        this.on('services-instantiated'),
        ...modules.map((m: ModuleInterface) => m.status$.on('ready-for-routes-instantiation'))
      ]).then(() => this.emit('ready-for-routes-instantiation'));

      Promise.all([
        this.on('routes-instantiated'),
        ...modules.map((m: ModuleInterface) => m.status$.on('ready-for-routes-activations'))
      ]).then(() => this.emit('ready-for-routes-activations'));

      Promise.all([
        this.on('routes-activated'),
        ...modules.map((m: ModuleInterface) => m.status$.on('all-good'))
      ]).then(() => this.emit('all-good'));
    }
  }


  private index(status: string): number {
    return STATUS_ORDER.indexOf(status);
  }

}