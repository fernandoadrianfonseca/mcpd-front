import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RestService } from '../rest.service';
import { ProductosStock } from '../../../models/stock.model';
import { HttpParams } from '@angular/common/http';

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

  getStockDisponibleParaAsignar(): Observable<ProductosStock[]> {
    return this.restService.get<ProductosStock[]>('stock/disponible-asignar');
  }

  asignarCustodia(items: { stockId: number; cantidad: number; }[], legajo: number) {
    return this.restService.post('stock/asignar-custodia?legajoEmpleado=' + legajo, items);
  }
  
  showSuccessMessage(message: string, duration: number){
    this.restService.showMessage(message, 'success', duration*1000, 'top', false);
  }

  generarReporteConLista(requestDto: any): Observable<Blob> {
    return this.restService.post<Blob>('reportes/pdf', requestDto, { responseType: 'blob' });
  }

  getStockCustodiaExcluyendo(legajo: number): Observable<ProductosStock[]> {
    return this.restService.get<ProductosStock[]>(`stock/custodia/excluyendo?legajo=${legajo}`);
  }

  quitarCustodia(ids: number[]): Observable<void> {
    return this.restService.post<void>('stock/quitar-custodia', ids);
  }
  
  getStockAsignado(): Observable<ProductosStock[]> {
    return this.restService.get<ProductosStock[]>('stock/con-custodia');
  }
  
  getStockSinBaja(): Observable<ProductosStock[]> {
    return this.restService.get<ProductosStock[]>('stock/sin-baja');
  }
  
  getStockConBaja(): Observable<ProductosStock[]> {
    return this.restService.get<ProductosStock[]>('stock/con-baja');
  }

  getRemitosPorStock(id: number): Observable<any[]> {
    return this.restService.get<any[]>(`stock-flujo/producto-stock/${id}/remitos`);
  }

  getNumerosDeSeriePorStock(id: number, options?: { activo?: boolean, empleadoCustodia?: number }): Observable<any[]> {
    let params = new HttpParams();
  
    if (options?.activo !== undefined) {
      params = params.set('activo', options.activo.toString());
    }
  
    if (options?.empleadoCustodia !== undefined) {
      params = params.set('empleadoCustodia', options.empleadoCustodia.toString());
    }
  
    return this.restService.get<any[]>(`numeros-de-serie/producto-stock/${id}`, { params });
  }

  crearFlujoDeStock(flujo: any): Observable<any> {
    return this.restService.post('stock-flujo', flujo);
  }
  
  crearNumerosDeSerie(numeros: any[]): Observable<any> {
    return this.restService.post('numeros-de-serie/lote', numeros);
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
}
