import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RestService } from '../rest.service';
import { ReporteRequest } from '../../../models/reporte-request.model';

@Injectable({
  providedIn: 'root'
})
export class ReporteService {

  constructor(private restService: RestService) {}

  // ✅ Generar un reporte y obtener el PDF en Blob
  generarReporteConLista(requestDto: ReporteRequest): Observable<Blob> {
    return this.restService.post<Blob>('reportes/pdf', requestDto, { responseType: 'blob' });
  }

  // ✅ Mostrar mensajes de éxito o error
  showSuccessMessage(message: string, duration: number) {
    this.restService.showMessage(message, 'success', duration * 1000, 'top', false);
  }

  showErrorMessage(message: string, duration: number) {
    this.restService.showMessage(message, 'error', duration * 1000, 'top', false);
  }
}
