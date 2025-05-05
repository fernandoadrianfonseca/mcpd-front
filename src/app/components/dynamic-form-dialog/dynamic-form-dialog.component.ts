// dynamic-form-dialog.component.ts
import { ChangeDetectorRef, Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, FormArray } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../modules/material/material.module';

@Component({
  selector: 'dynamic-form-dialog',
  templateUrl: './dynamic-form-dialog.component.html',
  styleUrls: ['./dynamic-form-dialog.component.scss'],
  imports: [CommonModule, MaterialModule, ReactiveFormsModule, FormsModule]
})
export class DynamicFormDialogComponent {
  form: FormGroup;
  multipleFields: { [key: string]: FormArray } = {};

  constructor(
    public dialogRef: MatDialogRef<DynamicFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { title: string, fields: any[] },
    private fb: FormBuilder,
    private cdRef: ChangeDetectorRef
  ) {
    const controls: any = {};

    data.fields.forEach(field => {
      if (field.multiple) {
        const array = this.fb.array([this.fb.control('', field.required ? Validators.required : null)]);
        this.multipleFields[field.name] = array;
        controls[field.name] = array;
      } else {
        controls[field.name] = field.required
          ? [field.default || '', Validators.required]
          : [field.default || ''];
      }
    });

    this.form = this.fb.group(controls);
  }

  addField(fieldName: string) {
    const array = this.form.get(fieldName) as FormArray;
    array.push(this.fb.control('', Validators.required));
    this.cdRef.detectChanges();
  }

  removeField(fieldName: string, index: number) {
    const array = this.form.get(fieldName) as FormArray;
    if (array.length > 1) array.removeAt(index);
  }

  confirm() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }

  cancel() {
    this.dialogRef.close(null);
  }

  getFieldArray(name: string): FormArray {
    return this.form.get(name) as FormArray;
  }
}
