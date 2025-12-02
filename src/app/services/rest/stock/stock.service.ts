import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RestService } from '../rest.service';
import { ProductosStock } from '../../../models/stock.model';
import { HttpParams } from '@angular/common/http';
import { StockCategoria } from '../../../models/stock-categoria.model';
import { StockProducto } from '../../../models/stock-producto.model';

@Injectable({
  providedIn: 'root'
})
export class StockService {
  constructor(private restService: RestService) {}

  getStock(): Observable<ProductosStock[]> {
    return this.restService.get<ProductosStock[]>('stock');
  }

  crearStock(stock: ProductosStock): Observable<ProductosStock> {
    return this.restService.post<ProductosStock>('stock', stock);
  }

  actualizarStock(id: number | string, stock: ProductosStock): Observable<ProductosStock> {
    return this.restService.put<ProductosStock>(`stock/${id}`, stock);
  }

  eliminarStock(id: number | string): Observable<void> {
    return this.restService.delete<void>(`stock/${id}`);
  }

  getStockPorCustodia(legajo: number) {
    return this.restService.get<any[]>(`stock/custodia/${legajo}`);
  }

  getStockExcluyendoCustodia(legajo: number): Observable<ProductosStock[]> {
    return this.restService.get<ProductosStock[]>(`stock/excluyendo-custodia/${legajo}`);
  }

  getStockDisponibleParaAsignar(): Observable<ProductosStock[]> {
    return this.restService.get<ProductosStock[]>('stock/disponible-asignar');
  }

  asignarCustodia(items: { stockId: number; cantidad: number; observaciones?: string }[], legajoCustodia: number, legajoCarga: number) {
    return this.restService.post('stock/asignar-custodia?legajoCustodia=' + legajoCustodia + '&legajoCarga=' + legajoCarga, items);
  }

  quitarCustodia(items: { stockId: number; cantidad: number; observaciones?: string }[], legajoCustodia: number, legajoCarga: number) {
    return this.restService.post('stock/quitar-custodia?legajoCustodia=' + legajoCustodia + '&legajoCarga=' + legajoCarga, items);
  }

  transferirCustodia(
    items: { stockId: number; cantidad: number; observaciones?: string }[],
    legajoOrigen: number,
    legajoDestino: number,
    legajoCarga: number) {
    const url = `stock/transferir-custodia?legajoOrigen=${legajoOrigen}&legajoDestino=${legajoDestino}&legajoCarga=${legajoCarga}`;
    return this.restService.post(url, items);
  }
  
  showSuccessMessage(message: string, duration: number){
    this.restService.showMessage(message, 'success', duration*1000, 'top', false);
  }

  showErrorMessage(message: string, duration: number){
    this.restService.showMessage(message, 'error', duration*1000, 'top', false);
  }
  
  getInformacionProductoEnStock(id: number, options?: { activo?: boolean, empleadoCustodia?: number }): Observable<any[]> {
    let params = new HttpParams();
  
    if (options?.activo !== undefined) {
      params = params.set('activo', options.activo.toString());
    }
  
    if (options?.empleadoCustodia !== undefined) {
      params = params.set('empleadoCustodia', options.empleadoCustodia.toString());
    }
  
    return this.restService.get<any[]>(`informacion/producto-stock/${id}`, { params });
  }

  getInformacionProductoSinCustodiaEnStock(id: number): Observable<any[]> {
    return this.restService.get<any[]>(`informacion/producto-stock/${id}/sin-custodia`);
  }

  crearInformacionProductos(informacionProductos: any[]): Observable<any> {
    return this.restService.post('informacion/lote', informacionProductos, {}, true);
  }

  darDeBajaProductos(ids: number[]): Observable<any> {
    return this.restService.put('informacion/darDeBaja', ids);
  }

  asignarCustodiaProductos(ids: number[], legajo?: number): Observable<any> {
    const url = legajo != null
      ? `informacion/asignar-custodia?legajo=${legajo}`
      : `informacion/asignar-custodia`;
  
    return this.restService.put<any>(url, ids);
  }

  crearFlujoDeStock(flujo: any): Observable<any> {
    return this.restService.post('stock-flujo', flujo);
  }
  
  getCustodiasActivasPorStock(productoStockId: number): Observable<any[]> {
    return this.restService.get<any[]>(`stock-flujo/producto-stock/${productoStockId}/custodias-activas`);
  }

  getAltasYBajasPorStock(stockId: number, legajoCustodia?: number): Observable<any[]> {
    let params = new HttpParams();
  
    if (legajoCustodia !== undefined) {
      params = params.set('legajoCustodia', legajoCustodia.toString());
    }
  
    return this.restService.get<any[]>(`stock-flujo/producto-stock/${stockId}/flujos-altas-bajas`, { params });
  }

  getPrestamosPendientesDeDevolucion(legajo: number): Observable<any[]> {
    return this.restService.get<any[]>(`stock-flujo/pendientes-devolucion?legajo=${legajo}`);
  }

  getStockPorCategoria(): Observable<StockCategoria[]> {
    return this.restService.get<StockCategoria[]>('stock/por-categorias');
  }

  getStockPorProducto(): Observable<StockProducto[]> {
    return this.restService.get<StockProducto[]>('stock/por-producto');
  }
}
