import { Component, Inject } from '@angular/core';
import { MaterialModule } from '../../modules/material/material.module';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
  imports: [MaterialModule]
})
export class ConfirmDialogComponent {
  
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { message: string } // Recibe el mensaje como parámetro
  ) {}

  /** ✅ Usuario acepta la acción */
  confirm(): void {
    this.dialogRef.close(true);
  }

  /** ❌ Usuario cancela la acción */
  cancel(): void {
    this.dialogRef.close(false);
  }
}
