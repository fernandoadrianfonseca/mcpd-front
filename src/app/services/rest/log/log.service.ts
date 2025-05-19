import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RestService } from '../rest.service';
import { Log } from '../../../models/log.model';
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class LogService {
  constructor(private restService: RestService) {}

  // ✅ Obtener todos los logs
  obtenerTodos(): Observable<Log[]> {
    return this.restService.get<Log[]>('logs');
  }

  // ✅ Obtener un log por ID
  obtenerPorId(id: number): Observable<Log> {
    return this.restService.get<Log>(`logs/${id}`);
  }

  // ✅ Crear un nuevo log
  guardar(log: Log): Observable<Log> {
    return this.restService.post<Log>('logs', log);
  }

  // ✅ Eliminar un log por ID
  eliminar(id: number): Observable<void> {
    return this.restService.delete<void>(`logs/${id}`);
  }
}
