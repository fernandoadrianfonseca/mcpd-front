import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RestService } from '../rest.service';
import { Pedido } from '../../../models/pedido.model';
import { Presupuesto, PresupuestoDetalle } from '../../../models/presupuesto.model';

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

  entregarPedido(numero: number): Observable<any> {
    return this.restService.put(`pedidos/entregar/${numero}`, {});
  }

  archivarPedido(numero: number): Observable<any> {
    return this.restService.put(`pedidos/archivar/${numero}`, {});
  }

  crearPedidoDetalle(detalle: any) {
    return this.restService.post('pedidos-detalle', detalle);
  }

  crearDetallesDelPedido(detalles: any[]): Observable<any> {
    return this.restService.post('pedidos-detalle/lote', detalles);
  }

  obtenerPedidoPorNumero(numero: number): Observable<any> {
    return this.restService.get(`pedidos/${numero}`);
  }

  actualizarPedido(numero: number, pedido: any): Observable<any> {
    return this.restService.put(`pedidos/${numero}`, pedido);
  }

  eliminarDetallesDelPedido(pedidoId: number): Observable<void> {
    return this.restService.delete(`pedidos-detalle/por-pedido/${pedidoId}`);
  }

  actualizarAutorizacion(id: number, tipo: 'pañol' | 'hacienda', valor: boolean): Observable<any> {
    return this.restService.put(`pedidos/${id}/autorizar`, { tipo, valor });
  }

  eliminarPedido(numero: number): Observable<any> {
    return this.restService.delete(`pedidos/${numero}`);
  }

  listarPedidos(): Observable<any[]> {
    return this.restService.get('pedidos');
  }

  getPedidosInternosConStockDisponible(): Observable<Pedido[]> {
    return this.restService.get('pedidos/con-stock-disponible');
  }

  getDestinos(): Observable<any[]> {
    return this.restService.get('pedidos/opciones/destinos');
  }

  getDirecciones(): Observable<any[]> {
    return this.restService.get('pedidos/opciones/direcciones');
  }

  getSecretarias(): Observable<any[]> {
    return this.restService.get('pedidos/opciones/secretarias');
  }

  getPresupuestosPorPedido(numeroPedido: number): Observable<Presupuesto[]> {
    return this.restService.get<Presupuesto[]>(`presupuestos/porPedido/${numeroPedido}`);
  }

  crearPresupuesto(presupuesto: Presupuesto): Observable<any> {
    return this.restService.post('presupuestos', presupuesto);
  }

  crearDetallesPresupuesto(detalles: PresupuestoDetalle[] | null | undefined): Observable<PresupuestoDetalle[]> {
    return this.restService.post('presupuestos-detalle/lote', detalles);
  }

  getDetallesPorPresupuesto(numero: number | undefined): Observable<PresupuestoDetalle[]> {
    return this.restService.get(`presupuestos-detalle/por-presupuesto/${numero}`);
  }

  showSuccessMessage(message: string, duration: number){
    this.restService.showMessage(message, 'success', duration*1000, 'top', false);
  }

  showErrorMessage(message: string, duration: number){
    this.restService.showMessage(message, 'error', duration*1000, 'top', false);
  }
}
