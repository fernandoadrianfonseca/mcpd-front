import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RestService } from '../rest.service';
import { Empleado } from '../../../models/empleado.model';

@Injectable({
  providedIn: 'root'
})
export class EmpleadoService {
  constructor(private restService: RestService) {}

  getEmpleados(): Observable<Empleado[]> {
    return this.restService.get<Empleado[]>('empleados');
  }

  crearEmpleado(empleado: Empleado): Observable<Empleado> {
    return this.restService.post<Empleado>('empleados', empleado);
  }

  actualizarEmpleado(legajo: number | string, empleado: Empleado): Observable<Empleado> {
    return this.restService.put<Empleado>(`empleados/${legajo}`, empleado);
  }

  eliminarEmpleado(legajo: number | string): Observable<void> {
    return this.restService.delete<void>(`empleados/${legajo}`);
  }
}
