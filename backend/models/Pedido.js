const mongoose = require('mongoose');

const pedidoSchema = new mongoose.Schema({
  uid: { type: String, required: true, index: true },
  fecha: { type: String, required: true }, // Formato YYYY-MM-DD
  cliente: { type: String, required: true, trim: true },
  producto: { type: String, required: true, trim: true },
  cantidad: { type: Number, required: true, min: 1 },
  precioUnit: { type: Number, required: true, min: 0 },
  envio: { type: Number, required: true, min: 0, default: 0 },
  subtotal: { type: Number, required: true },
  total: { type: Number, required: true },
  created_at: { type: Date, default: Date.now }
});

pedidoSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Pedido', pedidoSchema);