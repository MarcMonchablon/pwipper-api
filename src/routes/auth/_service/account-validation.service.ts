
export class AccountValidationService {
  constructor() {}


  public isEmail(emailOrUsername: string): boolean {
    return emailOrUsername.indexOf('@') !== -1;
  }


  checkEmailMinLength(email: string): boolean { return email.length > 3; }
  checkEmailMaxLength(email: string): boolean { return email.length < 100; }
  checkEmailCharset(email: string): boolean { return email.indexOf('@') !== -1; }

  checkUsernameMinLength(username: string): boolean { return username.length > 0; }
  checkUsernameMaxLength(username: string): boolean { return username.length < 15; }

  // For now we only watch for space or @ in username;
  checkUsernameCharset(username: string): boolean { return !/[\s|@]/.test(username); }
}
