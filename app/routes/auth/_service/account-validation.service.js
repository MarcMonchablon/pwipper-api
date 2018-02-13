
class AccountValidationService {
  constructor() {}


  isEmail(emailOrUsername) {
    return emailOrUsername.indexOf('@') !== -1;
  }


  isValidEmail(email) {
    return true; // TODO
  }


  isValidUsername(username) {
    return true; // TODO
  }
}


module.exports = AccountValidationService;
