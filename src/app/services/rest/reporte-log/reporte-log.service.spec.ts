import { TestBed } from '@angular/core/testing';
import { ReporteLogService } from './reporte-log.service';

describe('ReporteLogService', () => {
  let service: ReporteLogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReporteLogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
