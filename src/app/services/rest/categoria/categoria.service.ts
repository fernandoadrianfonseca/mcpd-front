import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RestService } from '../rest.service';
import { Categoria } from '../../../models/categoria.model';

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  constructor(private restService: RestService) {}

  getCategorias(): Observable<Categoria[]> {
    return this.restService.get<Categoria[]>('categorias');
  }

  crearCategoria(categoria: Categoria): Observable<Categoria> {
    return this.restService.post<Categoria>('categorias', categoria);
  }

  actualizarCategoria(id: number | string, categoria: Categoria): Observable<Categoria> {
    return this.restService.put<Categoria>(`categorias/${id}`, categoria);
  }

  eliminarCategoria(id: number | string): Observable<void> {
    return this.restService.delete<void>(`categorias/${id}`);
  }

  showSuccessMessage(message: string, duration: number){
    this.restService.showMessage(message, 'success', duration*1000, 'top', false);
  }
}