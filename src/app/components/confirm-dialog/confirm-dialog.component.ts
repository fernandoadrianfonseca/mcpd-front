import { Component, Inject } from '@angular/core';
import { MaterialModule } from '../../modules/material/material.module';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
  imports: [MaterialModule, CommonModule]
})
export class ConfirmDialogComponent {
  
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      message: string;
      okOnly?: boolean;
      okLabel?: string;
      icon?: string;         
      iconColor?: string;    
      title?: string;
    }
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
