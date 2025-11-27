import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private config: any = {};

  constructor(private http: HttpClient) {}

  async loadConfig(): Promise<void> {
    this.config = await firstValueFrom(this.http.get('/assets/config/config.json'));
  }

  get apiUrl(): string {
    const currentHost = window.location.origin;

    // Si la app está siendo accedida desde 192.168.1.181:8080
    if (currentHost === 'https://192.168.1.181:8080' ||
        currentHost === 'http://192.168.1.181:8080') {

      return `${currentHost}/mcpd`;
    }

    // Caso normal: usa el config.json
    return this.config.apiUrl || '';
  }
}