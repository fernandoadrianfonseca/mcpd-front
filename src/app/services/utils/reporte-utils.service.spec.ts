import { TestBed } from '@angular/core/testing';

import { ReporteUtilsService } from './reporte-utils.service';

describe('ReporteUtils', () => {
  let service: ReporteUtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReporteUtilsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
