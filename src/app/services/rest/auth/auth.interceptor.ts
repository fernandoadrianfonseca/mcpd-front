import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  get token(): string | null {
    return localStorage.getItem('token');
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.token) {
      req = req.clone({
        setHeaders: { Authorization: `Bearer ${this.token}` }
      });
    }
    return next.handle(req);
  }
}
