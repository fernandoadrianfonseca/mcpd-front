import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Usuario } from '../../../models/usuario.model';
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

  login(usuario: string, password: string): Observable<Usuario> {
    const body = new HttpParams()
      .set('usuario', usuario)
      .set('password', password);

    return this.restService.post<Usuario>(this.endpoint,
                                          body.toString(),
                                          {headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded'})},
                                          true);
  }

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
    localStorage.removeItem(this.sessionKey);
    this.currentSessionId = null;
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

  showSuccessMessage(message: string, duration: number){
    this.restService.showMessage(message, 'success', duration*1000, 'top', false);
  }

  showErrorMessage(message: string, duration: number){
    this.restService.showMessage(message, 'error', duration*1000, 'top', false);
  }
}