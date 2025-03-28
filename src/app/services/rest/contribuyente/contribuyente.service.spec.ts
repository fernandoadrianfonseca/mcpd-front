import { TestBed } from '@angular/core/testing';

import { ContribuyenteService } from './contribuyente.service';

describe('ContribuyenteService', () => {
  let service: ContribuyenteService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ContribuyenteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
