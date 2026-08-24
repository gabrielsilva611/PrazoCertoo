const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const { tratarErros } = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/auth', authRoutes);

app.use(tratarErros);

module.exports = app;
