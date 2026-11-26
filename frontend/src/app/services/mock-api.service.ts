import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, delay, map, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface MetricasIndustria {
  industria: string;
  atencion: number;
  tiempo: number;
  resolucion: number;
  fuente: string;
  actualizado: string;
  origen: 'api' | 'local';
}

/** Datos de respaldo: se usan si no hay URL de MockAPI.io o si la API falla. */
const MOCK_LOCAL: MetricasIndustria = {
  industria: 'Servicio al cliente (promedio de la industria)',
  atencion: 4.1,
  tiempo: 3.8,
  resolucion: 4.3,
  fuente: 'Mock local',
  actualizado: '2026-11-01',
  origen: 'local',
};

@Injectable({ providedIn: 'root' })
export class MockApiService {
  private http = inject(HttpClient);

  getIndustria(): Observable<MetricasIndustria> {
    const url = environment.mockApiUrl;

    if (!url) {
      return of(MOCK_LOCAL).pipe(delay(300));
    }

    return this.http.get<unknown>(url).pipe(
      map((resp) => {
        // MockAPI.io devuelve un arreglo; aceptamos también un objeto simple
        const d = (Array.isArray(resp) ? resp[0] : resp) as Partial<MetricasIndustria> | undefined;
        if (!d) {
          throw new Error('Respuesta vacía');
        }
        const atencion = Number(d.atencion);
        const tiempo = Number(d.tiempo);
        const resolucion = Number(d.resolucion);
        if (![atencion, tiempo, resolucion].every(Number.isFinite)) {
          throw new Error('Formato inválido');
        }
        return {
          industria: d.industria ?? 'Industria',
          atencion,
          tiempo,
          resolucion,
          fuente: d.fuente ?? 'MockAPI.io',
          actualizado: d.actualizado ?? '',
          origen: 'api' as const,
        };
      }),
      catchError(() => of(MOCK_LOCAL).pipe(delay(300)))
    );
  }
}