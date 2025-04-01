import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RestService } from '../rest.service';
import { ProductosStock } from '../../../models/stock.model';

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

  showSuccessMessage(message: string, duration: number){
    this.restService.showMessage(message, 'success', duration*1000, 'top', false);
  }
}
