
export class CredentialsService {
  constructor() {}


  passwordMatch(account, credentials, password) {
    switch (credentials.hashingMethod) {
      case 'none':
        return credentials.hash === password;
        break;
      default:
        throw new Error(`Hashing method '${credentials.hashingMethod}' not supported`);
    }
  };
}
