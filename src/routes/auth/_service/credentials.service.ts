
export class CredentialsService {
  constructor() {}


  public passwordMatch(account: string, credentials: any, password: string): boolean {
    switch (credentials.hashingMethod) {
      case 'none':
        return credentials.hash === password;
        break;
      default:
        throw new Error(`Hashing method '${credentials.hashingMethod}' not supported`);
    }
  };
}
