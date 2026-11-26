require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const verificarToken = require('./auth.middleware');
const encuestasRouter = require('./routes/encuestas');
const pedidosRouter = require('./routes/pedidos');

const app = express();
const PORT = process.env.PORT || 3000;

connectDB();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Parcial 2: Encuestas
app.use('/api/encuestas', verificarToken, encuestasRouter);

// Parcial 1: Pedidos (Mini E-commerce)
app.use('/api/pedidos', verificarToken, pedidosRouter);

app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});