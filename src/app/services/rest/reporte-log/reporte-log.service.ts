import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RestService } from '../rest.service';
import { ReporteLog } from '../../../models/reporte-log.model';
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ReporteLogService {

  constructor(private restService: RestService) {}

  // ✅ Obtener todos los reportes
  getReportesLog(): Observable<ReporteLog[]> {
    return this.restService.get<ReporteLog[]>('reportes-log');
  }

  // ✅ Obtener un reporte por ID
  getReporteLogById(id: number): Observable<ReporteLog> {
    return this.restService.get<ReporteLog>(`reportes-log/${id}`);
  }

  // ✅ Crear un nuevo reporte
  crearReporteLog(reporte: ReporteLog): Observable<ReporteLog> {
    return this.restService.post<ReporteLog>('reportes-log', reporte);
  }

  // ✅ Actualizar un reporte existente
  actualizarReporteLog(id: number, reporte: ReporteLog): Observable<ReporteLog> {
    return this.restService.put<ReporteLog>(`reportes-log/${id}`, reporte);
  }

  // ✅ Eliminar un reporte por ID
  eliminarReporteLog(id: number): Observable<void> {
    return this.restService.delete<void>(`reportes-log/${id}`);
  }

  // ✅ Buscar reportes por usuario
  getReportesPorUsuario(usuarioId: number): Observable<ReporteLog[]> {
    return this.restService.get<ReporteLog[]>(`reportes-log/usuario/${usuarioId}`);
  }

  // ✅ Buscar reportes por nombre parcial
  buscarReportesPorNombre(nombre: string): Observable<ReporteLog[]> {
    return this.restService.get<ReporteLog[]>(`reportes-log/buscar?nombre=${nombre}`);
  }

  // ✅ Buscar reportes por rango de fecha
  getReportesPorRangoDeFecha(inicio: string, fin: string): Observable<ReporteLog[]> {
    let params = new HttpParams()
      .set('inicio', inicio)
      .set('fin', fin);

    return this.restService.get<ReporteLog[]>('reportes-log/fecha', { params });
  }

  // ✅ Mostrar mensajes de éxito o error
  showSuccessMessage(message: string, duration: number) {
    this.restService.showMessage(message, 'success', duration * 1000, 'top', false);
  }

  showErrorMessage(message: string, duration: number) {
    this.restService.showMessage(message, 'error', duration * 1000, 'top', false);
  }
}
