import { Injectable, NgZone, inject, signal } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  User,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private zone = inject(NgZone);
  private app = initializeApp(environment.firebase);
  private auth = getAuth(this.app);
  private provider = new GoogleAuthProvider();

  /** Usuario autenticado actual (null si no hay sesión). */
  readonly user = signal<User | null>(null);

  /** Se resuelve cuando Firebase terminó de restaurar la sesión inicial. */
  readonly initialized: Promise<void>;

  constructor() {
    this.provider.setCustomParameters({ prompt: 'select_account' });
    this.initialized = new Promise<void>((resolve) => {
      onAuthStateChanged(this.auth, (u) => {
        this.zone.run(() => this.user.set(u));
        resolve();
      });
    });
  }

  async loginConGoogle(): Promise<void> {
    await signInWithPopup(this.auth, this.provider);
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }

  /** ID Token vigente para enviar al backend (Firebase lo renueva si hace falta). */
  async getToken(): Promise<string | null> {
    const u = this.auth.currentUser;
    return u ? u.getIdToken() : null;
  }
}