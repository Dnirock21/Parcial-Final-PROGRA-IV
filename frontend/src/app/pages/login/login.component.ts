import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  template: `
    <main class="login-wrap">
      <section class="login-card">
        <h1>Evaluación Integral de Satisfacción del Cliente</h1>
        <p>Inicia sesión con tu cuenta de Google para registrar y consultar tus encuestas.</p>

        @if (error()) {
          <div class="error">{{ error() }}</div>
        }

        <button type="button" class="btn-google" [disabled]="cargando()" (click)="ingresar()">
          {{ cargando() ? 'Conectando...' : 'Continuar con Google' }}
        </button>
      </section>
    </main>
  `,
  styles: [
    `
      .login-wrap {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
      }
      .login-card {
        background: #fff;
        border-radius: 16px;
        padding: 2.5rem 2rem;
        max-width: 420px;
        width: 100%;
        text-align: center;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.1);
      }
      h1 {
        font-size: 1.4rem;
        margin: 0 0 0.75rem;
      }
      p {
        color: #475569;
        margin: 0 0 1.5rem;
      }
      .btn-google {
        width: 100%;
        padding: 0.8rem 1rem;
        font-size: 1rem;
        font-weight: 600;
        color: #fff;
        background: #2563eb;
        border: none;
        border-radius: 10px;
        cursor: pointer;
      }
      .btn-google:hover:not(:disabled) {
        background: #1d4ed8;
      }
      .btn-google:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .error {
        background: #fee2e2;
        color: #991b1b;
        padding: 0.6rem 0.8rem;
        border-radius: 8px;
        margin-bottom: 1rem;
        font-size: 0.9rem;
      }
    `,
  ],
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  cargando = signal(false);
  error = signal<string | null>(null);

  constructor() {
    // Si ya hay sesión activa, pasa directo al dashboard
    this.auth.initialized.then(() => {
      if (this.auth.user()) {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  async ingresar(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      await this.auth.loginConGoogle();
      await this.router.navigate(['/dashboard']);
    } catch (e) {
      this.error.set('No se pudo iniciar sesión con Google. Inténtalo de nuevo.');
    } finally {
      this.cargando.set(false);
    }
  }
}