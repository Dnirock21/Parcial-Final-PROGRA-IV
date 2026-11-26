const express = require('express');
const { Usuario, Encuesta } = require('../models/Encuesta');

const router = express.Router();

const INDICADORES = [
  { key: 'atencion', nombre: 'Atención al cliente' },
  { key: 'tiempo', nombre: 'Tiempo de respuesta' },
  { key: 'resolucion', nombre: 'Resolución de problemas' },
];

const redondear2 = (n) => Math.round(n * 100) / 100;

function clasificar(promedio) {
  if (promedio >= 4.5) return 'Excelente';
  if (promedio >= 3.0) return 'Aceptable';
  return 'Deficiente';
}

function mejorYPeor(valores) {
  const nums = INDICADORES.map((i) => valores[i.key]);
  const max = Math.max(...nums);
  const min = Math.min(...nums);

  if (max === min) {
    return { mejor: 'Todos iguales', peor: 'Todos iguales' };
  }
  const nombres = (v) =>
    INDICADORES.filter((i) => valores[i.key] === v)
      .map((i) => i.nombre)
      .join(' / ');
  return { mejor: nombres(max), peor: nombres(min) };
}

// ---------------------------------------------------------------------------
// POST /api/encuestas  -> crear una encuesta del usuario autenticado
// ---------------------------------------------------------------------------
router.post('/', async (req, res, next) => {
  try {
    const { atencion, tiempo, resolucion } = req.body || {};
    const valores = { atencion, tiempo, resolucion };

    for (const { key, nombre } of INDICADORES) {
      const v = valores[key];
      if (!Number.isInteger(v) || v < 1 || v > 5) {
        return res
          .status(400)
          .json({ error: `${nombre} debe ser un número entero entre 1 y 5.` });
      }
    }

    const promedioExacto = (atencion + tiempo + resolucion) / 3;
    const promedio = redondear2(promedioExacto);
    const clasificacion = clasificar(promedioExacto);
    const { mejor, peor } = mejorYPeor(valores);

    const { uid, email, nombre } = req.user;

    // UPSERT equivalente en MongoDB
    await Usuario.findOneAndUpdate(
      { uid },
      { uid, email, nombre },
      { upsert: true, new: true }
    );

    const nuevaEncuesta = await Encuesta.create({
      user_id: uid,
      user_email: email,
      atencion,
      tiempo,
      resolucion,
      promedio,
      clasificacion,
      mejor_indicador: mejor,
      peor_indicador: peor,
    });

    return res.status(201).json(nuevaEncuesta.toJSON());
  } catch (err) {
    return next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/encuestas  -> listar SOLO las encuestas del usuario autenticado
// ---------------------------------------------------------------------------
router.get('/', async (req, res, next) => {
  try {
    const encuestas = await Encuesta.find({ user_id: req.user.uid })
      .sort({ created_at: -1, _id: -1 })
      .limit(100);

    return res.json(encuestas.map((e) => e.toJSON()));
  } catch (err) {
    return next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/encuestas/stats  -> reporte inicial + datos para las gráficas
// ---------------------------------------------------------------------------
router.get('/stats', async (req, res, next) => {
  try {
    const { uid, email, nombre } = req.user;

    const [statsAgg] = await Encuesta.aggregate([
      { $match: { user_id: uid } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          ultimo_registro: { $max: '$created_at' },
          atencion: { $avg: '$atencion' },
          tiempo: { $avg: '$tiempo' },
          resolucion: { $avg: '$resolucion' },
          general: { $avg: '$promedio' },
        },
      },
    ]);

    const distAgg = await Encuesta.aggregate([
      { $match: { user_id: uid } },
      { $group: { _id: '$clasificacion', cantidad: { $sum: 1 } } },
    ]);

    const r = statsAgg || {};
    const total = Number(r.total) || 0;

    const promedios = {
      atencion: redondear2(Number(r.atencion) || 0),
      tiempo: redondear2(Number(r.tiempo) || 0),
      resolucion: redondear2(Number(r.resolucion) || 0),
      general: redondear2(Number(r.general) || 0),
    };

    const distribucion = { Excelente: 0, Aceptable: 0, Deficiente: 0 };
    distAgg.forEach((d) => {
      distribucion[d._id] = Number(d.cantidad);
    });

    let mejorGlobal = null;
    let peorGlobal = null;
    let clasificacionGlobal = null;
    if (total > 0) {
      const mp = mejorYPeor(promedios);
      mejorGlobal = mp.mejor;
      peorGlobal = mp.peor;
      clasificacionGlobal = clasificar(Number(r.general));
    }

    return res.json({
      usuario: { uid, email, nombre },
      total,
      ultimo_registro: r.ultimo_registro || null,
      promedios,
      clasificacion_global: clasificacionGlobal,
      mejor_global: mejorGlobal,
      peor_global: peorGlobal,
      distribucion,
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;