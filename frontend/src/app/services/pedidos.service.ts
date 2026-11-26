import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Pedido {
  id?: string;
  fecha: string;
  cliente: string;
  producto: string;
  cantidad: number;
  precioUnit: number;
  envio: number;
  subtotal?: number;
  total?: number;
}

@Injectable({ providedIn: 'root' })
export class PedidosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/pedidos`;

  listar(cliente?: string): Observable<Pedido[]> {
    let params = new HttpParams();
    if (cliente && cliente.trim()) {
      params = params.set('cliente', cliente.trim());
    }
    return this.http.get<Pedido[]>(this.apiUrl, { params });
  }

  crear(pedido: Pedido): Observable<Pedido> {
    return this.http.post<Pedido>(this.apiUrl, pedido);
  }

  actualizar(id: string, pedido: Pedido): Observable<Pedido> {
    return this.http.put<Pedido>(`${this.apiUrl}/${id}`, pedido);
  }

  eliminar(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}