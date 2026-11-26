import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { AuthService } from '../../services/auth.service';
import { SatisfaccionService } from '../../services/satisfaccion.service';
import { MetricasIndustria, MockApiService } from '../../services/mock-api.service';
import {
  Encuesta,
  INDICADORES,
  IndicadorKey,
  NuevaEncuesta,
  Stats,
  calcularResultado,
} from '../../models/encuesta.model';


Chart.register(...registerables);

interface FilaComparacion {
  key: IndicadorKey;
  nombre: string;
  usuario: number | null;
  industria: number;
  diferencia: number | null;
  estado: 'arriba' | 'abajo' | 'igual' | 'sin-datos';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private auth = inject(AuthService);
  private api = inject(SatisfaccionService);
  private mock = inject(MockApiService);
  private router = inject(Router);

  @ViewChild('barCanvas') barCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('radarCanvas') radarCanvas!: ElementRef<HTMLCanvasElement>;

  private barChart?: Chart<'bar'>;
  private radarChart?: Chart<'radar'>;

  readonly indicadores = INDICADORES;
  readonly escala = [1, 2, 3, 4, 5];
  readonly etiquetas = INDICADORES.map((i) => i.nombre);

  usuario = this.auth.user;
  stats = signal<Stats | null>(null);
  historial = signal<Encuesta[]>([]);
  industria = signal<MetricasIndustria | null>(null);

  valores = signal<NuevaEncuesta>({ atencion: 3, tiempo: 3, resolucion: 3 });
  preview = computed(() => calcularResultado(this.valores()));

  ultimoResultado = signal<Encuesta | null>(null);
  enviando = signal(false);
  cargando = signal(true);
  error = signal<string | null>(null);

  comparacion = computed<FilaComparacion[]>(() => {
    const ind = this.industria();
    const s = this.stats();
    if (!ind) {
      return [];
    }
    return INDICADORES.map((i) => {
      const usuario = s && s.total > 0 ? s.promedios[i.key] : null;
      const industria = ind[i.key];
      const diferencia = usuario === null ? null : Math.round((usuario - industria) * 100) / 100;
      let estado: FilaComparacion['estado'] = 'sin-datos';
      if (diferencia !== null) {
        estado = diferencia > 0.05 ? 'arriba' : diferencia < -0.05 ? 'abajo' : 'igual';
      }
      return { key: i.key, nombre: i.nombre, usuario, industria, diferencia, estado };
    });
  });

  ngOnInit(): void {
    this.cargarDatos();
    this.cargarIndustria();
  }

  ngAfterViewInit(): void {
    this.crearGraficas();
    this.actualizarGraficas();
  }

  ngOnDestroy(): void {
    this.barChart?.destroy();
    this.radarChart?.destroy();
  }

  setValor(key: IndicadorKey, valor: number): void {
    this.valores.update((v) => ({ ...v, [key]: valor }));
  }

  guardar(evento: Event): void {
    evento.preventDefault();
    if (this.enviando()) {
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    this.ultimoResultado.set(null);

    this.api.crear(this.valores()).subscribe({
      next: (encuesta) => {
        this.ultimoResultado.set(encuesta);
        this.enviando.set(false);
        this.cargarDatos();
      },
      error: (err) => {
        this.error.set(err?.error?.error ?? 'No se pudo guardar la encuesta.');
        this.enviando.set(false);
      },
    });
  }

  async cerrarSesion(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/login']);
  }

  claseClasificacion(c: string | null | undefined): string {
    switch (c) {
      case 'Excelente':
        return 'b-excelente';
      case 'Aceptable':
        return 'b-aceptable';
      case 'Deficiente':
        return 'b-deficiente';
      default:
        return 'b-neutro';
    }
  }

  private cargarDatos(): void {
    this.cargando.set(true);

    this.api.stats().subscribe({
      next: (s) => {
        this.stats.set(s);
        this.actualizarGraficas();
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.error ?? 'No se pudieron cargar las estadísticas.');
        this.cargando.set(false);
      },
    });

    this.api.listar().subscribe({
      next: (lista) => this.historial.set(lista),
      error: () => this.error.set('No se pudo cargar el historial de encuestas.'),
    });
  }

  private cargarIndustria(): void {
    this.mock.getIndustria().subscribe((m) => {
      this.industria.set(m);
      this.actualizarGraficas();
    });
  }

  private crearGraficas(): void {
    this.barChart = new Chart(this.barCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: this.etiquetas,
        datasets: [
          {
            label: 'Tus promedios',
            data: [0, 0, 0],
            backgroundColor: 'rgba(37, 99, 235, 0.85)',
            borderRadius: 6,
          },
          {
            label: 'Promedio industria',
            data: [0, 0, 0],
            backgroundColor: 'rgba(148, 163, 184, 0.85)',
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { min: 0, max: 5, ticks: { stepSize: 1 } } },
        plugins: { legend: { position: 'bottom' } },
      },
    });

    this.radarChart = new Chart(this.radarCanvas.nativeElement, {
      type: 'radar',
      data: {
        labels: this.etiquetas,
        datasets: [
          {
            label: 'Tus promedios',
            data: [0, 0, 0],
            backgroundColor: 'rgba(37, 99, 235, 0.25)',
            borderColor: 'rgb(37, 99, 235)',
            pointBackgroundColor: 'rgb(37, 99, 235)',
          },
          {
            label: 'Promedio industria',
            data: [0, 0, 0],
            backgroundColor: 'rgba(148, 163, 184, 0.15)',
            borderColor: 'rgb(100, 116, 139)',
            pointBackgroundColor: 'rgb(100, 116, 139)',
            borderDash: [6, 4],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { r: { min: 0, max: 5, ticks: { stepSize: 1 } } },
        plugins: { legend: { position: 'bottom' } },
      },
    });
  }

  private actualizarGraficas(): void {
    if (!this.barChart || !this.radarChart) {
      return;
    }
    const s = this.stats();
    const ind = this.industria();

    const datosUsuario = INDICADORES.map((i) => (s ? s.promedios[i.key] : 0));
    const datosIndustria = INDICADORES.map((i) => (ind ? ind[i.key] : 0));

    this.barChart.data.datasets[0].data = datosUsuario;
    this.barChart.data.datasets[1].data = datosIndustria;
    this.barChart.update();

    this.radarChart.data.datasets[0].data = datosUsuario;
    this.radarChart.data.datasets[1].data = datosIndustria;
    this.radarChart.update();
  }
}