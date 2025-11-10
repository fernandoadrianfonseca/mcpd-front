import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ConfigService } from '../config/config.service';
import { ErrorHandlerService } from '../error-handler/error-handler.service';
import { MatSnackBar, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { UtilsService } from '../utils/utils.service';
import { Log } from '../../models/log.model';

@Injectable({
  providedIn: 'root'
})
export class RestService {
  private apiUrl: string;
  private storedUser: any;
  private usuario: any;

  constructor(private http: HttpClient,
              private configService: ConfigService,
              private errorHandler: ErrorHandlerService,
              private snackBar: MatSnackBar,
              private router: Router) {

    this.apiUrl = configService.apiUrl;
    this.storedUser = localStorage.getItem('usuario');
    if(this.storedUser){
      this.usuario = JSON.parse(this.storedUser);
    }
    
  }

  get<T>(endpoint: string, options?: {skipErrorHandler?: boolean; params?: HttpParams; }): Observable<T> {
    const { skipErrorHandler = false, params } = options || {};
  
    return this.http.get<T>(`${this.apiUrl}/${endpoint}`, { params }).pipe(
      catchError(err => this.handleError(err, `ERROR: GET ${endpoint}`, skipErrorHandler))
    );
  }

  post<T>(endpoint: string, data: any, options: object = {}, skipErrorHandler = false): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}/${endpoint}`, data, options).pipe(catchError(err => this.handleError(err, `ERROR: POST ${endpoint}`, skipErrorHandler)));
  }

  put<T>(endpoint: string, data: any, skipErrorHandler = false): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}/${endpoint}`, data).pipe(catchError(err => this.handleError(err, `ERROR: PUT ${endpoint}`, skipErrorHandler)));
  }

  delete<T>(endpoint: string, skipErrorHandler = false): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}/${endpoint}`).pipe(catchError(err => this.handleError(err, `ERROR: DELETE ${endpoint}`, skipErrorHandler)));
  }

  private handleError(error: HttpErrorResponse, operation: string, skipErrorHandler: boolean): Observable<never> {
    console.error('Error en la solicitud:', error);

    let errorMessage = 'Error desconocido';
    let parsedErrorMessage = 'Error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error de cliente (navegador)
      errorMessage = `Error de red: ${error.error.message}`;
    } else {
      // Error del servidor
      errorMessage = `Error ${error.status}: ${error.message}`;
      if (error.error.message) {
        errorMessage += ` - ${error.error.message}`;
      }
      if (error.error) {
        errorMessage += ` - ${error.error}`;
      }
    }

    // Reemplazo de mensajes innecesarios
    errorMessage = errorMessage.replace(": 0 Unknown Error", "");

    switch (error.status) {
      case 0:
        parsedErrorMessage = 'Servidor caído. Intente más tarde.';
        break;
      case 400:
        parsedErrorMessage = '';
        break;
      case 401:
        parsedErrorMessage = 'Credenciales incorrectas.';
        break;
      case 403:
        parsedErrorMessage = 'No tienes permisos para acceder.';
        break;
      case 500:
        parsedErrorMessage = 'Error interno del servidor.';
        break;
      default:
        parsedErrorMessage = ``;
        break;
    }

    // Mostrar snackbar y overlay
    if (!skipErrorHandler && !this.errorHandler.isErrorDisplayed) {
      this.showMessage(`${operation}: ${parsedErrorMessage} ${errorMessage}`, 'error', 1000000, 'top', true);
      this.errorHandler.showError(parsedErrorMessage + ' ' + errorMessage);
    }
    this.guardarLog(this.usuario?.nombre ?? 'Sin Loguear', 'ERROR: ' + parsedErrorMessage + ' ' + errorMessage);
    return throwError(() => new Error(parsedErrorMessage + ' ' + errorMessage));
  }

  public showMessage(message: string, type: 'success' | 'error', duration: number, position: MatSnackBarVerticalPosition, goToMain: boolean) {
    this.snackBar.open(message, 'Cerrar', {
      duration: duration,
      verticalPosition: position,
      horizontalPosition: 'center',
      panelClass: ['snack-bar-custom', type === 'success' ? 'snack-bar-success' : 'snack-bar-error']
    }).afterDismissed().subscribe(() => {
      if(goToMain){
        this.errorHandler.clearError();
        this.router.navigate(['/']);
      }
    });
  }

  guardar(log: Log): Observable<Log> {
    return this.post<Log>('logs', log);
  }

  guardarLog(operador: string, movimiento: string) {
    const nuevoLog = new Log({ operador: operador, movimiento: movimiento });
    this.guardar(nuevoLog).subscribe(() => { });
  }
}