import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, FormArray } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../modules/material/material.module';
import { StockService } from '../../services/rest/stock/stock.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'dynamic-form-dialog',
  templateUrl: './dynamic-form-dialog.component.html',
  styleUrls: ['./dynamic-form-dialog.component.scss'],
  imports: [CommonModule, MaterialModule, ReactiveFormsModule, FormsModule]
})
export class DynamicFormDialogComponent implements OnInit {
  form: FormGroup;
  multipleFields: { [key: string]: FormArray } = {};
  seriesDisponibles: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<DynamicFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { title: string, fields: any[] },
    private fb: FormBuilder,
    private cdRef: ChangeDetectorRef,
    private stockService: StockService,
    private dialog: MatDialog
  ) {
    const controls: any = {};

    data.fields.forEach(field => {
      if (field.multiple) {
        const array = this.fb.array([this.fb.control('', field.required ? Validators.required : null)]);
        this.multipleFields[field.name] = array;
        controls[field.name] = array;
      } else if (field.type === 'serie-selector') {
        
        // 🔄 Selector múltiple para números de serie
        controls[field.name] = this.fb.control([]);

        // 🚀 Llamar al servicio para obtener los números de serie
        this.stockService.getNumerosDeSerieSinCustodiaPorStock(field.stockId)
          .subscribe((data) => {
            this.seriesDisponibles = data.map((item: any) => ({
              label: item.numeroDeSerie,
              value: item.id
            }));
            this.cdRef.detectChanges();
          });
      } else {
        controls[field.name] = field.required
          ? [field.default || '', Validators.required]
          : [field.default || ''];
      }
    });

    this.form = this.fb.group(controls);
  }

  ngOnInit(): void {
    this.cdRef.detectChanges();
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
      const cantidad = this.form.get('cantidad')?.value;
      const numerosDeSerie = this.form.get('numerosDeSerie')?.value || [];

      // ✅ Validación de cantidad vs números de serie
      if (numerosDeSerie.length > cantidad) {
        this.mostrarDialogoOk('La Cantidad De Números De Serie Seleccionados No Puede Ser Mayor A La Cantidad Ingresada.', {
          icono: 'error_outline',
          colorIcono: '#d32f2f',
          titulo: 'Cantidad inválida'
        });
        return;
      }

      // ✅ Si pasa la validación, se cierra el modal con el valor
      this.dialogRef.close(this.form.value);
    }
  }

  cancel() {
    this.dialogRef.close(null);
  }

  getFieldArray(name: string): FormArray {
    return this.form.get(name) as FormArray;
  }

  eliminarSerie(fieldName: string, serie: any) {
    const control = this.form.get(fieldName);
    if (control) {
      const updatedList = control.value.filter((s: any) => s.value !== serie.value);
      control.setValue(updatedList);
    }
  }

  private mostrarDialogoOk(
    mensaje: string,
    opciones?: {
      icono?: string;
      colorIcono?: string;
      titulo?: string;
      textoBotonOk?: string;
    }
  ): void {
    this.dialog.open(ConfirmDialogComponent, {
      width: '500px',
      data: {
        message: mensaje,
        okOnly: true,
        icon: opciones?.icono || 'help_outline',
        iconColor: opciones?.colorIcono || '#2196f3',
        title: opciones?.titulo,
        okLabel: opciones?.textoBotonOk || 'OK'
      }
    });
  }

  obtenerLabelSerie(id: number): string {
    const idNumber = Number(id); // Lo casteo en el método, no en el template
    const serie = this.seriesDisponibles.find(s => s.value === idNumber);
    return serie ? serie.label : id.toString();
  }
}
