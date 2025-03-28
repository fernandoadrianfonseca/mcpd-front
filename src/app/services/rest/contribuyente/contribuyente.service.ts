import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RestService } from '../rest.service';
import { Contribuyente } from '../../../models/contribuyente.model';

@Injectable({
  providedIn: 'root'
})
export class ContribuyenteService {
  constructor(private restService: RestService) {}

  getContribuyentes(): Observable<Contribuyente[]> {
    return this.restService.get<Contribuyente[]>('contribuyentes');
  }

  crearContribuyente(contribuyente: Contribuyente): Observable<Contribuyente> {
    return this.restService.post<Contribuyente>('contribuyentes', contribuyente);
  }

  actualizarContribuyente(cuit: number | string, contribuyente: Contribuyente): Observable<Contribuyente> {
    return this.restService.put<Contribuyente>(`contribuyentes/${cuit}`, contribuyente);
  }

  eliminarContribuyente(cuit: number | string): Observable<void> {
    return this.restService.delete<void>(`contribuyentes/${cuit}`);
  }
}
