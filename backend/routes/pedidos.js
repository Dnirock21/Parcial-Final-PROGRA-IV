const express = require('express');
const Pedido = require('../models/Pedido');

const router = express.Router();
const redondear2 = (n) => Math.round(n * 100) / 100;

// GET /api/pedidos -> Listar pedidos (con filtro opcional ?cliente=...)
router.get('/', async (req, res, next) => {
  try {
    const filtro = { uid: req.user.uid };
    if (req.query.cliente && req.query.cliente.trim() !== '') {
      filtro.cliente = { $regex: req.query.cliente.trim(), $options: 'i' };
    }

    const pedidos = await Pedido.find(filtro).sort({ fecha: -1, created_at: -1 });
    return res.json(pedidos.map((p) => p.toJSON()));
  } catch (err) {
    return next(err);
  }
});

// POST /api/pedidos -> Crear pedido con cálculos en servidor
router.post('/', async (req, res, next) => {
  try {
    const { fecha, cliente, producto, cantidad, precioUnit, envio } = req.body || {};

    if (!fecha || !cliente?.trim() || !producto?.trim()) {
      return res.status(400).json({ error: 'Fecha, cliente y producto son obligatorios.' });
    }
    const cant = Number(cantidad);
    const precio = Number(precioUnit);
    const costoEnvio = Number(envio || 0);

    if (!Number.isFinite(cant) || cant <= 0) {
      return res.status(400).json({ error: 'La cantidad debe ser mayor a 0.' });
    }
    if (!Number.isFinite(precio) || precio < 0) {
      return res.status(400).json({ error: 'El precio unitario debe ser mayor o igual a 0.' });
    }
    if (!Number.isFinite(costoEnvio) || costoEnvio < 0) {
      return res.status(400).json({ error: 'El costo de envío no puede ser negativo.' });
    }

    const subtotal = redondear2(cant * precio);
    const total = redondear2(subtotal + costoEnvio);

    const nuevoPedido = await Pedido.create({
      uid: req.user.uid,
      fecha,
      cliente: cliente.trim(),
      producto: producto.trim(),
      cantidad: cant,
      precioUnit: precio,
      envio: costoEnvio,
      subtotal,
      total
    });

    return res.status(201).json(nuevoPedido.toJSON());
  } catch (err) {
    return next(err);
  }
});

// PUT /api/pedidos/:id -> Editar pedido existente
router.put('/:id', async (req, res, next) => {
  try {
    const { fecha, cliente, producto, cantidad, precioUnit, envio } = req.body || {};

    if (!fecha || !cliente?.trim() || !producto?.trim()) {
      return res.status(400).json({ error: 'Fecha, cliente y producto son obligatorios.' });
    }
    const cant = Number(cantidad);
    const precio = Number(precioUnit);
    const costoEnvio = Number(envio || 0);

    if (!Number.isFinite(cant) || cant <= 0) {
      return res.status(400).json({ error: 'La cantidad debe ser mayor a 0.' });
    }
    if (!Number.isFinite(precio) || precio < 0) {
      return res.status(400).json({ error: 'El precio unitario debe ser mayor o igual a 0.' });
    }

    const subtotal = redondear2(cant * precio);
    const total = redondear2(subtotal + costoEnvio);

    const actualizado = await Pedido.findOneAndUpdate(
      { _id: req.params.id, uid: req.user.uid },
      {
        fecha,
        cliente: cliente.trim(),
        producto: producto.trim(),
        cantidad: cant,
        precioUnit: precio,
        envio: costoEnvio,
        subtotal,
        total
      },
      { new: true }
    );

    if (!actualizado) {
      return res.status(404).json({ error: 'Pedido no encontrado.' });
    }

    return res.json(actualizado.toJSON());
  } catch (err) {
    return next(err);
  }
});

// DELETE /api/pedidos/:id -> Eliminar pedido
router.delete('/:id', async (req, res, next) => {
  try {
    const eliminado = await Pedido.findOneAndDelete({
      _id: req.params.id,
      uid: req.user.uid
    });

    if (!eliminado) {
      return res.status(404).json({ error: 'Pedido no encontrado.' });
    }

    return res.json({ message: 'Pedido eliminado correctamente.' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;