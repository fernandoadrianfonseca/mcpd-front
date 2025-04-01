import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RestService } from '../rest.service';
import { Proveedor } from '../../../models/proveedor.model';

@Injectable({
  providedIn: 'root'
})
export class ProveedorService {
  constructor(private restService: RestService) {}

  getProveedores(): Observable<Proveedor[]> {
    return this.restService.get<Proveedor[]>('proveedores');
  }

  crearProveedor(proveedor: Proveedor): Observable<Proveedor> {
    return this.restService.post<Proveedor>('proveedores', proveedor);
  }

  actualizarProveedor(cuit: number | string, proveedor: Proveedor): Observable<Proveedor> {
    return this.restService.put<Proveedor>(`proveedores/${cuit}`, proveedor);
  }

  eliminarProveedor(cuit: number | string): Observable<void> {
    return this.restService.delete<void>(`proveedores/${cuit}`);
  }

  showSuccessMessage(message: string, duration: number) {
    this.restService.showMessage(message, 'success', duration * 1000, 'top', false);
  }
}
