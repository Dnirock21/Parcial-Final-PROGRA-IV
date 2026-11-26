const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  nombre: { type: String, required: true }
});

const encuestaSchema = new mongoose.Schema({
  user_id: { type: String, required: true, index: true },
  user_email: { type: String, required: true },
  atencion: { type: Number, required: true, min: 1, max: 5 },
  tiempo: { type: Number, required: true, min: 1, max: 5 },
  resolucion: { type: Number, required: true, min: 1, max: 5 },
  promedio: { type: Number, required: true },
  clasificacion: { type: String, required: true },
  mejor_indicador: { type: String },
  peor_indicador: { type: String },
  created_at: { type: Date, default: Date.now }
});

// Transformar _id a id al devolver JSON para mantener 100% compatibilidad con Angular
encuestaSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Usuario = mongoose.model('Usuario', usuarioSchema);
const Encuesta = mongoose.model('Encuesta', encuestaSchema);

module.exports = { Usuario, Encuesta };