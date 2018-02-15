
class AuthQueryService {
  constructor(database) {
    this.db = database;
  }


  fetchAccount_id(accountId) {
    console.log('AuthQueryService::fetchAccount_id:', accountId); // TODO
  }


  fetchAccount_username(username) {
    console.log('AuthQueryService::fetchAccount_username:', username); // TODO
  }


  checkLogin_email(email, password) {
    const query = `
    SELECT * 
    FROM accounts INNER JOIN credentials ON (accounts.account_id = credentials.account_id)
    WHERE email = $1;`;

    return this.db.getClient()
      .query(query, [email])
      .then(this._mapCheckLoginResult);
  }


  checkLogin_username(username, password) {
    const query = `
    SELECT * 
    FROM accounts INNER JOIN credentials ON (accounts.account_id = credentials.account_id)
    WHERE username = $1;`;

    return this.db.getClient()
      .query(query, [username])
      .then(this._mapCheckLoginResult);
  }


  _mapCheckLoginResult(pgResult) {
    if (pgResult.rows.length === 0) {
      return {
        empty: true,
        account: null,
        credentials: null
      };
    } else {
      const row = pgResult.rows[0];
      return {
        empty: false,
        account: {
          id: row.account_id,
          username: row.username,
          email: row.email
        },
        credentials: {
          hashingMethod: row.hashing_method,
          hash: row.hash
        }
      };
    }
  }
}


module.exports = AuthQueryService;
