import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RestService } from '../rest.service';
import { Producto } from '../../../models/producto.model';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  constructor(private restService: RestService) {}

  getProductos(): Observable<Producto[]> {
    return this.restService.get<Producto[]>('productos');
  }

  crearProducto(producto: Producto): Observable<Producto> {
    return this.restService.post<Producto>('productos', producto);
  }

  actualizarProducto(id: number | string, producto: Producto): Observable<Producto> {
    return this.restService.put<Producto>(`productos/${id}`, producto);
  }

  eliminarProducto(id: number | string): Observable<void> {
    return this.restService.delete<void>(`productos/${id}`);
  }

  showSuccessMessage(message: string, duration: number){
    this.restService.showMessage(message, 'success', duration*1000, 'top', false);
  }
}