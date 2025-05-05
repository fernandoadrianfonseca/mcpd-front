import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmTableDialogComponent } from './confirm-table-dialog.component';

describe('ConfirmTableDialogComponent', () => {
  let component: ConfirmTableDialogComponent;
  let fixture: ComponentFixture<ConfirmTableDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmTableDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfirmTableDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
