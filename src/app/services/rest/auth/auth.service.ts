import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AuthResponse, Usuario } from '../../../models/usuario.model';
import { RestService } from '../rest.service';
import { HttpHeaders, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DialogService } from '../../dialog/dialog.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly endpoint = 'auth/login';
  private readonly sessionKey = 'sessionId';
  private currentSessionId: string | null = null;
  private currentUser: string | null = null;
  private isDevelopment : boolean = false;
  private tokenCheckTimer: any = null;
  private readonly TOKEN_CHECK_MS = 60_000; // 1 minuto

  constructor(private restService: RestService,
              private router: Router,
              private snackBar: MatSnackBar,
              private dialogService: DialogService) {

    this.isDevelopment = window.location.hostname === 'localhost' && window.location.port === '4200';            

    // ✅ Guardar la sesión actual al iniciar
    this.currentSessionId = this.getSessionId();
    this.currentUser = this.getUser();

    // ✅ Detectar cambios en la sesión (para cuando se inicie sesión en otra pestaña)
    window.addEventListener('storage', (event) => {
      if (event.key === this.sessionKey) {
        let newSessionId = localStorage.getItem(this.sessionKey);
        let user = localStorage.getItem('usuario');
        if(newSessionId==null && this.currentSessionId!=null){
          newSessionId=this.currentSessionId;
        }
        if(user==null && this.currentUser!=null){
          user=this.currentUser;
          localStorage.setItem('usuario', user);
        }
        if (this.currentSessionId && newSessionId !== this.currentSessionId && this.router.url != '/') {
          console.log('Otra pestaña inició sesión. Redirigiendo al login...');
          this.router.navigate(['/']);
          this.showSuccessMessage('Sesion cerrada: Se abrio la aplicacion en otra pestaña', 10000000);
        }
      }
    });
  }

  login(usuario: string, password: string): Observable<AuthResponse> {
    const body = new HttpParams()
      .set('usuario', usuario)
      .set('password', password);

    return this.restService.post<AuthResponse>(this.endpoint,
                                          body.toString(),
                                          {headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded'})},
                                          true).pipe(tap(resp => {localStorage.setItem('token', resp.token);this.startTokenWatcher();}))
  };

  /** ✅ Guardar sesión */
  saveLogin(usuario: any) {
    localStorage.setItem('usuario', JSON.stringify(usuario));
    this.currentSessionId = this.generateSessionId();
    localStorage.setItem(this.sessionKey, this.currentSessionId);
  }

  /** ✅ Cerrar sesión y limpiar datos */
  logout() {

    this.dialogService.confirm('¿Está seguro que desea salir de la aplicación?').subscribe(result => {
      if (result) {
        this.clean();
        this.router.navigate(['/']);
      }
    });
  }

  clean(){
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    localStorage.removeItem(this.sessionKey);
    this.currentSessionId = null;
    if (this.tokenCheckTimer) {
      clearInterval(this.tokenCheckTimer);
      this.tokenCheckTimer = null;
    }
  }

  initUnloadListener() {
    if(!this.isDevelopment){
      window.addEventListener('beforeunload', () => {
        this.clean();
      });
    }
  }

  /** ✅ Obtener ID de sesión actual */
  getSessionId(): string | null {
    return localStorage.getItem(this.sessionKey);
  }

  getUser(): string | null {
    return localStorage.getItem('usuario');
  }

  modificarPassword(usuario: string, password: string): Observable<void> {
    return this.restService.post<void>('auth/modificar', null, {
      params: { usuario, password }
    });
  }

  /** ✅ Generar un identificador único de sesión */
  private generateSessionId(): string {
    return Math.random().toString(36).substring(2);
  }

  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Decodifica el payload del JWT (base64url) sin librerías
  private decodeJwtPayload<T = any>(token: string): T | null {
    try {
      const payload = token.split('.')[1];
      if (!payload) return null;
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  // Devuelve true si el token está vencido o es inválido
  private isTokenExpired(token: string): boolean {
    const payload = this.decodeJwtPayload<{ exp?: number }>(token);
    if (!payload || !payload.exp) return true;
    const nowSec = Math.floor(Date.now() / 1000);
    return nowSec >= payload.exp;
  }

  private startTokenWatcher(): void {
    // Limpio timer previo si existiera
    if (this.tokenCheckTimer) {
      clearInterval(this.tokenCheckTimer);
    }

    const check = () => {
      const token = this.getToken();
      if (!token) return; // no hay sesión, no hago nada
      if (this.isTokenExpired(token)) {
        // sesión expirada
        this.clean();
        this.showErrorMessage('Sesión expirada. Por favor, volvé a iniciar sesión.', 6);
        // Evitá loop de navegación si ya estás en /
        if (this.router.url !== '/') {
          this.router.navigate(['/']);
        }
      }
    };

    // Chequeo inmediato al iniciar
    check();

    // Chequeo cada 1 minuto
    this.tokenCheckTimer = setInterval(check, this.TOKEN_CHECK_MS);

    // (Opcional) Si la pestaña vuelve a estar visible, re-chequear
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check();
    });
  }

  showSuccessMessage(message: string, duration: number){
    this.restService.showMessage(message, 'success', duration*1000, 'top', false);
  }

  showErrorMessage(message: string, duration: number){
    this.restService.showMessage(message, 'error', duration*1000, 'top', false);
  }
}