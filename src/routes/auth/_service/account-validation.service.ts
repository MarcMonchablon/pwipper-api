
export class AccountValidationService {
  constructor() {}


  isEmail(emailOrUsername) {
    return emailOrUsername.indexOf('@') !== -1;
  }


  checkEmailMinLength(email) { return email.length > 3; }
  checkEmailMaxLength(email) { return email.length < 100; }
  checkEmailCharset(email) { return email.indexOf('@') !== -1; }

  checkUsernameMinLength(username) { return username.length > 0; }
  checkUsernameMaxLength(username) { return username.length < 15; }

  // For now we only watch for space or @ in username;
  checkUsernameCharset(username) { return !/[\s|@]/.test(username); }
}
