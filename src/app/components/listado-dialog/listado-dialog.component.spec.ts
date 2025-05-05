import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListadoDialogComponent } from './listado-dialog.component';

describe('ListadoDialogComponent', () => {
  let component: ListadoDialogComponent;
  let fixture: ComponentFixture<ListadoDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListadoDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListadoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
