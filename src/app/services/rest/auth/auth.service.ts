import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Usuario } from '../../../models/usuario.model';
import { RestService } from '../rest.service';
import { HttpHeaders, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly endpoint = 'auth/login';

  constructor(private restService: RestService) {}

  login(usuario: string, password: string): Observable<Usuario> {
    const body = new HttpParams()
      .set('usuario', usuario)
      .set('password', password);

    return this.restService.post<Usuario>(this.endpoint, body.toString(), {
      headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' })
    });
  }
}