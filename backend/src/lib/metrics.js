const client = require('prom-client');

// Registro: onde cada métrica fica guardada até o Prometheus vir buscar.
const register = new client.Registry();

// Métricas padrão do processo Node (CPU, memória, event loop, GC) — de graça,
// a lib já sabe coletar isso sozinha.
client.collectDefaultMetrics({ register });

// Métricas próprias da aplicação: quantas requisições e quanto tempo cada uma levou.
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total de requisições HTTP recebidas',
  labelNames: ['metodo', 'rota', 'status'],
  registers: [register],
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duração das requisições HTTP em segundos',
  labelNames: ['metodo', 'rota', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

// Middleware do Express: mede cada requisição e alimenta as duas métricas acima.
function medirRequisicoes(req, res, next) {
  const fimTimer = httpRequestDuration.startTimer();

  res.on('finish', () => {
    // req.route só existe depois do Express casar a rota — usa o path cru como
    // fallback (ex: numa 404) pra não perder a métrica.
    const rota = req.route ? `${req.baseUrl}${req.route.path}` : req.path;
    const labels = { metodo: req.method, rota, status: res.statusCode };

    httpRequestsTotal.inc(labels);
    fimTimer(labels);
  });

  next();
}

module.exports = { register, medirRequisicoes };
