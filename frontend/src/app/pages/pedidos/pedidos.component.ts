import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { PedidosService, Pedido } from '../../services/pedidos.service';

Chart.register(...registerables);

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './pedidos.component.html'
})
export class PedidosComponent implements OnInit, AfterViewInit {
  private pedidosService = inject(PedidosService);

  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  private chart: Chart | null = null;

  pedidos: Pedido[] = [];
  filtroCliente = '';
  editandoId: string | null = null;
  errorMsg = '';
  exitoMsg = '';

  form: Pedido = this.nuevoFormulario();

  ngOnInit(): void {
    this.cargarPedidos();
  }

  ngAfterViewInit(): void {
    this.renderizarGrafica();
  }

  nuevoFormulario(): Pedido {
    const hoy = new Date().toISOString().split('T')[0];
    return {
      fecha: hoy,
      cliente: '',
      producto: '',
      cantidad: 1,
      precioUnit: 0,
      envio: 0
    };
  }

  get subtotalPreview(): number {
    const cant = Number(this.form.cantidad) || 0;
    const precio = Number(this.form.precioUnit) || 0;
    return Math.round(cant * precio * 100) / 100;
  }

  get totalPreview(): number {
    const env = Number(this.form.envio) || 0;
    return Math.round((this.subtotalPreview + env) * 100) / 100;
  }

  get ingresoTotalFiltrado(): number {
    return Math.round(
      this.pedidos.reduce((acc, p) => acc + (p.total || 0), 0) * 100
    ) / 100;
  }

  cargarPedidos(): void {
    this.pedidosService.listar(this.filtroCliente).subscribe({
      next: (data) => {
        this.pedidos = data;
        this.renderizarGrafica();
      },
      error: (err) => {
        this.errorMsg = err?.error?.error || 'Error al cargar los pedidos.';
      }
    });
  }

  guardarPedido(): void {
    this.errorMsg = '';
    this.exitoMsg = '';

    if (this.form.cantidad <= 0) {
      this.errorMsg = 'La cantidad debe ser mayor a 0.';
      return;
    }
    if (this.form.precioUnit < 0) {
      this.errorMsg = 'El precio unitario debe ser mayor o igual a 0.';
      return;
    }

    if (this.editandoId) {
      this.pedidosService.actualizar(this.editandoId, this.form).subscribe({
        next: () => {
          this.exitoMsg = 'Pedido actualizado correctamente.';
          this.cancelarEdicion();
          this.cargarPedidos();
        },
        error: (err) => {
          this.errorMsg = err?.error?.error || 'Error al actualizar pedido.';
        }
      });
    } else {
      this.pedidosService.crear(this.form).subscribe({
        next: () => {
          this.exitoMsg = 'Pedido registrado correctamente.';
          this.form = this.nuevoFormulario();
          this.cargarPedidos();
        },
        error: (err) => {
          this.errorMsg = err?.error?.error || 'Error al registrar pedido.';
        }
      });
    }
  }

  editarPedido(p: Pedido): void {
    this.editandoId = p.id || null;
    this.form = {
      fecha: p.fecha,
      cliente: p.cliente,
      producto: p.producto,
      cantidad: p.cantidad,
      precioUnit: p.precioUnit,
      envio: p.envio
    };
    this.errorMsg = '';
    this.exitoMsg = '';
  }

  cancelarEdicion(): void {
    this.editandoId = null;
    this.form = this.nuevoFormulario();
  }

  eliminarPedido(id?: string): void {
    if (!id) return;
    if (!confirm('¿Estás seguro de eliminar este pedido?')) return;

    this.pedidosService.eliminar(id).subscribe({
      next: () => {
        this.exitoMsg = 'Pedido eliminado.';
        this.cargarPedidos();
      },
      error: (err) => {
        this.errorMsg = err?.error?.error || 'Error al eliminar pedido.';
      }
    });
  }

  renderizarGrafica(): void {
    if (!this.chartCanvas) return;

    // Agrupar ingresos totales por cliente
    const mapaClientes = new Map<string, number>();
    for (const p of this.pedidos) {
      const actual = mapaClientes.get(p.cliente) || 0;
      mapaClientes.set(p.cliente, Math.round((actual + (p.total || 0)) * 100) / 100);
    }

    const labels = Array.from(mapaClientes.keys());
    const valores = Array.from(mapaClientes.values());

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Ingresos Totales por Cliente ($)',
            data: valores,
            backgroundColor: '#0d6efd',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }
}