
export class Cache<T> {
  private store: {[objKey: string]: T};

  constructor() {
    this.store = {};
  }

  public save(obj: T, key: string): void {
    this.store[key] = obj;
  }

  public find(key: string): T | null {
    const foundObj = this.store[key];
    return (foundObj === undefined) ? null : foundObj;
  }

  public clear(key: string): void {
    delete this.store[key];
  }
}
