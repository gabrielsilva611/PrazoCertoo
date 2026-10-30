const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const vendaRoutes = require('./routes/vendaRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const { tratarErros } = require('./middlewares/errorHandler');

if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
  throw new Error('FRONTEND_URL precisa estar configurada em produção (usada pelo CORS).');
}

const app = express();
app.disable('x-powered-by');

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/auth', authRoutes);
app.use('/clientes', clienteRoutes);
app.use('/vendas', vendaRoutes);
app.use('/dashboard', dashboardRoutes);

app.use(tratarErros);

module.exports = app;
