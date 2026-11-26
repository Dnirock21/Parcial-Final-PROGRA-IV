export type IndicadorKey = 'atencion' | 'tiempo' | 'resolucion';
export type Clasificacion = 'Excelente' | 'Aceptable' | 'Deficiente';

export const INDICADORES: { key: IndicadorKey; nombre: string }[] = [
  { key: 'atencion', nombre: 'Atención al cliente' },
  { key: 'tiempo', nombre: 'Tiempo de respuesta' },
  { key: 'resolucion', nombre: 'Resolución de problemas' },
];

export interface NuevaEncuesta {
  atencion: number;
  tiempo: number;
  resolucion: number;
}

export interface Encuesta extends NuevaEncuesta {
  id: number;
  user_id: string;
  promedio: number;
  clasificacion: Clasificacion;
  mejor_indicador: string;
  peor_indicador: string;
  created_at: string;
}

export interface Stats {
  usuario: { uid: string; email: string; nombre: string };
  total: number;
  ultimo_registro: string | null;
  promedios: Record<IndicadorKey, number> & { general: number };
  clasificacion_global: Clasificacion | null;
  mejor_global: string | null;
  peor_global: string | null;
  distribucion: Record<Clasificacion, number>;
}

export function clasificar(promedio: number): Clasificacion {
  if (promedio >= 4.5) return 'Excelente';
  if (promedio >= 3.0) return 'Aceptable';
  return 'Deficiente';
}

export function mejorYPeor(valores: Record<IndicadorKey, number>): { mejor: string; peor: string } {
  const nums = INDICADORES.map((i) => valores[i.key]);
  const max = Math.max(...nums);
  const min = Math.min(...nums);

  if (max === min) {
    return { mejor: 'Todos iguales', peor: 'Todos iguales' };
  }
  const nombres = (v: number) =>
    INDICADORES.filter((i) => valores[i.key] === v)
      .map((i) => i.nombre)
      .join(' / ');
  return { mejor: nombres(max), peor: nombres(min) };
}

/** Cálculo local solo para la vista previa; el valor oficial lo calcula el backend. */
export function calcularResultado(v: NuevaEncuesta): {
  promedio: number;
  clasificacion: Clasificacion;
  mejor: string;
  peor: string;
} {
  const exacto = (v.atencion + v.tiempo + v.resolucion) / 3;
  const { mejor, peor } = mejorYPeor(v);
  return {
    promedio: Math.round(exacto * 100) / 100,
    clasificacion: clasificar(exacto),
    mejor,
    peor,
  };
}