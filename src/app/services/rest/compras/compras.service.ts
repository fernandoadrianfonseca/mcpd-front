import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RestService } from '../rest.service';
import { Pedido } from '../../../models/pedido.model';

@Injectable({
  providedIn: 'root'
})
export class ComprasService {

  constructor(private restService: RestService) {}

  getImputaciones(): Observable<any[]> {
    return this.restService.get('compras/imputaciones');
  }

  getPedidos(): Observable<any[]> {
    return this.restService.get('pedidos');
  }

  getPedidoPorId(id: number): Observable<Pedido> {
    return this.restService.get(`pedidos/${id}`);
  }

  crearPedido(pedido: any): Observable<any> {
    return this.restService.post('pedidos', pedido);
  }

  crearPedidoDetalle(detalle: any) {
    return this.restService.post('pedidos-detalle', detalle);
  }

  obtenerPedidoPorNumero(numero: number): Observable<any> {
    return this.restService.get(`pedidos/${numero}`);
  }

  actualizarPedido(numero: number, pedido: any): Observable<any> {
    return this.restService.put(`pedidos/${numero}`, pedido);
  }

  eliminarPedido(numero: number): Observable<any> {
    return this.restService.delete(`pedidos/${numero}`);
  }

  listarPedidos(): Observable<any[]> {
    return this.restService.get('pedidos');
  }

  showSuccessMessage(message: string, duration: number){
    this.restService.showMessage(message, 'success', duration*1000, 'top', false);
  }

  showErrorMessage(message: string, duration: number){
    this.restService.showMessage(message, 'error', duration*1000, 'top', false);
  }
}
