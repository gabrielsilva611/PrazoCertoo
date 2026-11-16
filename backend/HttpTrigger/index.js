const inject = require('light-my-request');
const app = require('../src/app');

module.exports = async function (context, req) {
  const url = new URL(req.url, 'http://localhost');

  const headersEntrada = { ...req.headers };
  delete headersEntrada['content-length'];
  delete headersEntrada['transfer-encoding'];

  const response = await inject(app, {
    method: req.method,
    url: url.pathname + url.search,
    headers: headersEntrada,
    payload: req.rawBody,
  });

  const headers = { ...response.headers };
  delete headers['transfer-encoding'];

  context.res = {
    status: response.statusCode,
    headers,
    body: response.rawPayload,
    isRaw: true,
  };
};
