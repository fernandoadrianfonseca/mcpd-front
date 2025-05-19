import { Injectable } from '@angular/core';
import { Log } from '../../models/log.model';
import { LogService } from '../rest/log/log.service';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {
  
  constructor(private logService: LogService){}

  /** Formatea una fecha tipo `Date` a 'dd/MM/yyyy' */
  formatDateToDDMMYYYY(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // los meses empiezan desde 0
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  formatDateToDDMMYYYYArgFormat(date: Date): string {
    const [d, m, y] = date.toLocaleDateString('es-AR').split('/');
    const day = d.padStart(2, '0');
    const month = m.padStart(2, '0');
    return `${day}/${month}/${y}`;
  }

  formatDateToDDMMYYYYZoneFormat(date: Date): string {
    const argentinaDate = new Date(date.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }));
    const day = String(argentinaDate.getDate()).padStart(2, '0');
    const month = String(argentinaDate.getMonth() + 1).padStart(2, '0');
    const year = argentinaDate.getFullYear();
    return `${day}/${month}/${year}`;
  }

  getEpochTimeMs(): number {
    return Date.now();
  }

  getEpochTimeSeconds(): number {
    return Math.floor(Date.now() / 1000);
  }

  getEpochTimeMinutes(): number {
    return Math.floor(Date.now() / 1000 / 60);
  }

  guardarLog(operador: string, movimiento: string) {
    const nuevoLog = new Log({ operador: operador, movimiento: movimiento });
    this.logService.guardar(nuevoLog).subscribe(() => { });
  }
}
