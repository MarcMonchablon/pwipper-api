
class AuthQueryService {
  constructor(dbClient) {
    this.dbClient = dbClient;
  }

  fetchAccount(accountId) {
    console.log('AuthQueryService::getAccount:', accountId);
  }
}

module.exports = AuthQueryService;
