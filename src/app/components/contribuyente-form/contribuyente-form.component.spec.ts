import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContribuyenteFormComponent } from './contribuyente-form.component';

describe('ContribuyenteFormComponent', () => {
  let component: ContribuyenteFormComponent;
  let fixture: ComponentFixture<ContribuyenteFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContribuyenteFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContribuyenteFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
