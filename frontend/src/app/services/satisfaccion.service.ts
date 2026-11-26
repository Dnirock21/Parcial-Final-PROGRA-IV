import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Encuesta, NuevaEncuesta, Stats } from '../models/encuesta.model';

@Injectable({ providedIn: 'root' })
export class SatisfaccionService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/encuestas`;

  crear(datos: NuevaEncuesta): Observable<Encuesta> {
    return this.http.post<Encuesta>(this.base, datos);
  }

  listar(): Observable<Encuesta[]> {
    return this.http.get<Encuesta[]>(this.base);
  }

  stats(): Observable<Stats> {
    return this.http.get<Stats>(`${this.base}/stats`);
  }
}