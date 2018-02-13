
class Route {
  constructor(verb, path, response) {
    if (!Route.checkVerb(verb)) {
      throw new TypeError(`[Route ${path}]: ${verb} is not a valid HTTP verb`);
    }

    this.verb = verb;
    this.path = path;
    this.response = response;
  }

  register(restifyServer) {
    const restifyMapping = {
      'POST': 'post',
      'GET': 'get',
      'PUT': 'put',
      'PATCH': 'patch',
      'DELETE': 'del',
      'HEAD': 'head',
      'OPTIONS': 'opts'
    };

    switch (this.verb) {
      case 'POST':
        restifyServer.post(this.path, this.response);
        break;
      case 'GET':
        restifyServer.get(this.path, this.response);
        break;
      default:
        console.error('Not done yet !'); // TODO
    }
  }

  static checkVerb(verb) {
    const httpVerb = ['POST', 'GET', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
    return httpVerb.includes(verb);
  }
}

module.exports = Route;