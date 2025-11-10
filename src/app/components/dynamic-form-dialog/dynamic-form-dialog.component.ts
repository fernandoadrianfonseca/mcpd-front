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
  codigosDisponibles: any[] = [];
  codigosAntiguosDisponibles: any[] = [];
  itemsById: Map<number, any> = new Map();
  modoActual: 'asignar' | 'transferir' | 'quitar' | null = null;

  constructor(
    public dialogRef: MatDialogRef<DynamicFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { title: string, fields: any[] },
    private fb: FormBuilder,
    private cdRef: ChangeDetectorRef,
    private stockService: StockService,
    private dialog: MatDialog
  ) {
    const controls: any = {};

    // mapa id -> item completo (para buscar relaciones)
    this.itemsById = new Map<number, any>();

    const fieldSerieSelector = data.fields.find(field => field.type === 'serie-selector');
    this.modoActual = fieldSerieSelector ? fieldSerieSelector.modo : null;

    data.fields.forEach(field => {
      if (field.multiple) {
        const array = this.fb.array([this.fb.control('', field.required ? Validators.required : null)]);
        this.multipleFields[field.name] = array;
        controls[field.name] = array;
      } else if (field.type === 'serie-selector') {
        // control para el selector (array de objetos { label, value })
        controls[field.name] = this.fb.control([]);

        // pedir datos (los mismos datos sirven para los 3 selectores; filtramos después)
        const observable = field.modo === 'asignar'
          ? this.stockService.getInformacionProductoSinCustodiaEnStock(field.stockId)
          : this.stockService.getInformacionProductoEnStock(field.stockId, {
              activo: true,
              empleadoCustodia: field.legajoEmpleado
            });

        observable.subscribe((items: any[]) => {
          // Actualizamos el mapa itemsById con todos los items (clave: id)
          items.forEach(it => {
            // guardamos el objeto tal cual (asegurar id numérico)
            const idNum = Number(it.id);
            this.itemsById.set(idNum, it);
          });

          // Ahora filtramos/armamos las listas para cada selector, pero siempre usando id y leyendo del mapa
          if (field.name === 'numeroDeSerie') {
            const filtrados = items.filter((it: any) => it.numeroDeSerie && it.numeroDeSerie.toString().trim() !== '');
            this.seriesDisponibles = filtrados.map((it: any) => ({
              label: it.numeroDeSerie,
              value: Number(it.id) // siempre number
            }));
          } else if (field.name === 'codigoAntiguo') {
            const filtrados = items.filter((it: any) => it.codigoAntiguo && it.codigoAntiguo.toString().trim() !== '');
            this.codigosAntiguosDisponibles = filtrados.map((it: any) => ({
              label: it.codigoAntiguo,
              value: Number(it.id)
            }));
          } else if (field.name === 'codigo') {
            const filtrados = items.filter((it: any) => it.codigo && it.codigo.toString().trim() !== '');
            this.codigosDisponibles = filtrados.map((it: any) => ({
              label: it.codigo,
              value: Number(it.id)
            }));
          }

          this.cdRef.detectChanges();
        });

      } else {
        controls[field.name] = field.required
          ? [field.default || '', Validators.required]
          : [field.default || ''];
      }
    });

    this.form = this.fb.group(controls);

    // subscripciones para sincronizar (llaman a this.syncSeleccion)
    const controlSeries = this.form.get('numeroDeSerie');
    const controlCodigosAntiguos = this.form.get('codigoAntiguo');
    const controlCodigos = this.form.get('codigo');

    if (controlSeries) {
      controlSeries.valueChanges.subscribe((seriesSeleccionadas: any[]) => {
        this.syncSeleccion('serie', seriesSeleccionadas || []);
      });
    }
    if (controlCodigosAntiguos) {
      controlCodigosAntiguos.valueChanges.subscribe((cods: any[]) => {
        this.syncSeleccion('codigoAntiguo', cods || []);
      });
    }
    if (controlCodigos) {
      controlCodigos.valueChanges.subscribe((cods: any[]) => {
        this.syncSeleccion('codigo', cods || []);
      });
    }
  }

  ngOnInit(): void {
    this.cdRef.detectChanges();
  }

  private syncSeleccion: (tipo: 'serie' | 'codigoAntiguo' | 'codigo', seleccionados: any[]) => void = (tipo, seleccionados) => {

    const controlSeries = this.form.get('numeroDeSerie');
    const controlCodigosAntiguos = this.form.get('codigoAntiguo');
    const controlCodigos = this.form.get('codigo');

    const seriesActuales = controlSeries?.value || [];
    const codigosAntiguosActuales = controlCodigosAntiguos?.value || [];
    const codigosActuales = controlCodigos?.value || [];

    const nuevasSeries = [...seriesActuales];
    const nuevosCodigosAntiguos = [...codigosAntiguosActuales];
    const nuevosCodigos = [...codigosActuales];

    seleccionados.forEach(sel => {
      const id = Number(sel.value);
      const itemRelacionado = this.itemsById.get(id);
      if (!itemRelacionado) return;

      // si itemRelacionado tiene numeroDeSerie -> buscar la opción en seriesDisponibles por value=id
      if (itemRelacionado.numeroDeSerie) {
        // buscamos la opción por id (no por label)
        const serieRel = this.seriesDisponibles?.find(s => Number(s.value) === id)
                      || this.seriesDisponibles?.find(s => s.label === itemRelacionado.numeroDeSerie);
        if (serieRel && !nuevasSeries.some(s => Number(s.value) === Number(serieRel.value))) {
          nuevasSeries.push(serieRel);
        }
      }

      // si tiene codigoAntiguo -> buscar opción en codigosAntiguosDisponibles por id o label
      if (itemRelacionado.codigoAntiguo) {
        const codigoAntiguoRel = this.codigosAntiguosDisponibles?.find(c => Number(c.value) === id)
                            || this.codigosAntiguosDisponibles?.find(c => c.label === itemRelacionado.codigoAntiguo);
        if (codigoAntiguoRel && !nuevosCodigosAntiguos.some(c => Number(c.value) === Number(codigoAntiguoRel.value))) {
          nuevosCodigosAntiguos.push(codigoAntiguoRel);
        }
      }

      // si tiene codigo -> buscar opción en codigosDisponibles
      if (itemRelacionado.codigo) {
        const codigoRel = this.codigosDisponibles?.find(c => Number(c.value) === id)
                        || this.codigosDisponibles?.find(c => c.label === itemRelacionado.codigo);
        if (codigoRel && !nuevosCodigos.some(c => Number(c.value) === Number(codigoRel.value))) {
          nuevosCodigos.push(codigoRel);
        }
      }
    });

    controlSeries?.setValue(nuevasSeries, { emitEvent: false });
    controlCodigosAntiguos?.setValue(nuevosCodigosAntiguos, { emitEvent: false });
    controlCodigos?.setValue(nuevosCodigos, { emitEvent: false });
    this.cdRef.detectChanges();
  };

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
      const numerosDeSerie = this.form.get('numeroDeSerie')?.value || [];
      const codigos = this.form.get('codigo')?.value || [];
      const codigosAntiguos = this.form.get('codigoAntiguo')?.value || [];

      // ⚙️ Determinar total de ítems seleccionados (sin duplicar si es el mismo ítem)
      const idsSeleccionados = new Set([
        ...numerosDeSerie.map((s: any) => s.value),
        ...codigos.map((c: any) => c.value),
        ...codigosAntiguos.map((c: any) => c.value)
      ]);

      // ✅ Validación de cantidad vs ítems únicos seleccionados
      if (idsSeleccionados.size > cantidad) {
        this.mostrarDialogoOk(
          'La cantidad de ítems seleccionados (numeros de series/códigos) no puede ser mayor a la cantidad ingresada.',
          {
            icono: 'error_outline',
            colorIcono: '#d32f2f',
            titulo: 'Cantidad inválida'
          }
        );
        return;
      }

      // ✅ Si pasa la validación, se cierra el modal con el valor completo del formulario
      this.dialogRef.close(this.form.value);
    }
  }

  cancel() {
    this.dialogRef.close(null);
  }

  getFieldArray(name: string): FormArray {
    return this.form.get(name) as FormArray;
  }

  eliminarItem(item: any) {
    const campos = ['numeroDeSerie', 'codigoAntiguo', 'codigo'];

    campos.forEach((campo) => {
      const control = this.form.get(campo);
      if (control) {
        const updatedList = (control.value || []).filter((s: any) => s.value !== item.value);
        control.setValue(updatedList);
      }
    });
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
