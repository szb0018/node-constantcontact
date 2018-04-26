const assemble = require('url-assembler');
const createError = require('http-errors');
const dotProp = require('dot-prop');
const debug = require('./debug');

function Resource(clientFactory, actions) {
  for (let [action, config] of Object.entries(actions)) {
    debug('setup')(`Building resource action ${action}`);

    this[action] = (params, qs = {}, data) => {
      const client = clientFactory();

      debug('resource')(`Called ${action}`);

      const method = config.method.toLowerCase();
      let url = assemble().template(config.url);
      let req;

      if (method === 'get') {
        url = url.param(params).toString();
        debug('resource')(`HTTP ${config.method} ${url}`);
        req = client[method](url);
      } else {
        url = url.param(params, true).query(qs).toString();
        debug('resource')(`HTTP ${config.method} ${url}`);
        debug('resource')('body:', params);
        req = client[method](url).body(data || params);
      }

      return this.invokeRequest(req);
    };
  }
};

Resource.invokeRequest = Resource.prototype.invokeRequest = (req) => {
  return new Promise((resolve, reject) => {
    req.request((err, res, body) => {
      if (err) {
        debug('resource')(`Error: HTTP ${res.statusCode}`);
        reject(createError(res.statusCode, body[0].error_message, { body }));
      } else {
        debug('resource')(`Response: HTTP ${res.statusCode}`);
        resolve(body);
      }
    });
  });
};

module.exports = Resource;
