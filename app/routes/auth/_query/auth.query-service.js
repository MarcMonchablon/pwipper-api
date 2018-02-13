
class AuthQueryService {
  constructor(dbClient) {
    this.dbClient = dbClient;
  }


  fetchAccount_id(accountId) {
    console.log('AuthQueryService::fetchAccount_id:', accountId); // TODO
  }


  fetchAccount_username(username) {
    console.log('AuthQueryService::fetchAccount_username:', username); // TODO
  }


  checkLogin_email(email, password) {
    console.log('CheckLogin / email');
    return 'CheckLogin / email'; // TODO;
  }


  checkLogin_username(username, password) {
    console.log('CheckLogin / username');
    return 'CheckLogin / username'; // TODO
  }
}


module.exports = AuthQueryService;
