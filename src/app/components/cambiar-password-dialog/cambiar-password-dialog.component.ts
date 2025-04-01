import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MaterialModule } from '../../modules/material/material.module';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'cambiar-password-dialog',
  templateUrl: './cambiar-password-dialog.component.html',
  styleUrls: ['./cambiar-password-dialog.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, MatDialogModule]
})
export class CambiarPasswordDialogComponent {
  passwordForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<CambiarPasswordDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public usuario: string
  ) {
    this.passwordForm = this.fb.group({
      password: ['', Validators.required],
      confirmar: ['', Validators.required]
    }, { validators: this.passwordsCoinciden });
  }

  passwordsCoinciden(group: FormGroup) {
    const pass = group.get('password')?.value;
    const confirmar = group.get('confirmar')?.value;
    return pass === confirmar ? null : { noCoinciden: true };
  }

  aceptar(): void {
    if (this.passwordForm.valid) {
      this.dialogRef.close(this.passwordForm.value.password);
    }
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }
}
