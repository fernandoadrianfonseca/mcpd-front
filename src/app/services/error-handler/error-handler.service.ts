import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerService {
  
  private errorSubject = new Subject<string | null>();
  error$ = this.errorSubject.asObservable();
  isErrorDisplayed = false;

  showError(message: string) {
    if (!this.isErrorDisplayed) {
      this.isErrorDisplayed = true; // ✅ Evita múltiples errores al mismo tiempo
      this.errorSubject.next(message);
    }
  }

  clearError() {
    this.isErrorDisplayed = false; // ✅ Permite mostrar nuevos errores después de cerrar el overlay
    this.errorSubject.next(null);
  }
}
