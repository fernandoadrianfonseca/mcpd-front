import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Contribuyente } from '../../models/contribuyente.model';
import { ContribuyenteService } from '../../services/rest/contribuyente/contribuyente.service';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../modules/material/material.module';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { DialogService } from '../../services/dialog/dialog.service';
import { UtilsService } from '../../services/utils/utils.service';

@Component({
  selector: 'app-contribuyente-form',
  templateUrl: './contribuyente-form.component.html',
  styleUrls: ['./contribuyente-form.component.scss'],
  imports: [CommonModule, MaterialModule, ReactiveFormsModule, FormsModule]
})
export class ContribuyenteFormComponent implements OnInit {
  contribuyenteForm!: FormGroup;
  contribuyentes: Contribuyente[] = [];
  displayedColumns: string[] = ['cuit', 'nombre', 'responsabilidad', 'acciones'];
  dataSource = new MatTableDataSource<Contribuyente>();
  editando: Contribuyente | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private fb: FormBuilder,
                private contribuyenteService: ContribuyenteService,
                  private dialogService: DialogService,
                   private utils: UtilsService,
                    @Inject('menuData') public menuData: any) {}

  ngOnInit(): void {
    this.contribuyenteForm = this.fb.group({
      cuit: ['', [Validators.required,
                  Validators.pattern(/^\d{11}$/),
                  this.validarCuitUnico.bind(this)]], 
      apellido: ['', Validators.required],
      nombre: ['', Validators.required],
      responsabilidad: ['', Validators.required],
      sexo: ['', Validators.required],
      domicilio: ['', Validators.required],
      telefono: ['', Validators.required],
      mail: ['', Validators.email],
      nacimiento: [''],
    });

    this.loadContribuyentes();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = filterValue;
  }

  loadContribuyentes(): void {
    this.contribuyenteService.getContribuyentes().subscribe(data => {
      this.contribuyentes = data;
      this.dataSource.data = this.contribuyentes;
      this.updatePaginator();
      this.dataSource.sort = this.sort;
    });
  }

  validarCuitUnico(control: AbstractControl) {
    const cuit = control.value;
    if (!cuit || this.editando || cuit.toString().length !== 11) return null;
  
    const existe = this.contribuyentes.some(c => c.cuit === +cuit);
    return existe ? { cuitExistente: true } : null;
  }

  onSubmit(): void {
    if (this.contribuyenteForm.valid) {

      this.contribuyenteForm.get('cuit')?.enable();
      const form = this.contribuyenteForm.value;
      const contribuyente: Contribuyente = {
        ...form,
        nombre: `${form.apellido} ${form.nombre}`,
        pais: "Argentina",
        provincia: "Santa Cruz",
        ciudad: "Puerto Deseado",
        codigoPostal: "9050"
      };
  
      if (this.editando) {
        // ✅ Usa el `cuit` para actualizar correctamente
        this.contribuyenteService.actualizarContribuyente(contribuyente.cuit, contribuyente).subscribe(() => {
          this.contribuyenteService.showSuccessMessage('Contribuyente CUIT ' + contribuyente.cuit + ' Actualizado Con Éxito', 5);
          this.utils.guardarLog(this.menuData?.empleadoLogueado?.nombre, 'Contribuyente CUIT ' + contribuyente.cuit + ' Actualizado');
          this.loadContribuyentes();
          this.cancelarEdicion();
        });
      } else {
        this.contribuyenteService.crearContribuyente(contribuyente).subscribe(() => {
          this.contribuyenteService.showSuccessMessage('Contribuyente CUIT ' + contribuyente.cuit + ' Agregado Con Éxito', 5);
          this.utils.guardarLog(this.menuData?.empleadoLogueado?.nombre, 'Contribuyente CUIT ' + contribuyente.cuit + ' Agregado');
          this.loadContribuyentes();
          this.cancelarEdicion();
        });
      }
    }
  }

  editarContribuyente(contribuyente: Contribuyente): void {
    this.editando = contribuyente;
    const [apellido, ...nombreResto] = contribuyente.nombre.split(' ');
    const nombre = nombreResto.join(' ');
    this.contribuyenteForm.patchValue({
      cuit: contribuyente.cuit,
      apellido: apellido,
      nombre: nombre,
      responsabilidad: contribuyente.responsabilidad,
      sexo: contribuyente.sexo,
      domicilio: contribuyente.domicilio,
      telefono: contribuyente.telefono,
      mail: contribuyente.mail,
      nacimiento: contribuyente.nacimiento
    });
    this.contribuyenteForm.get('cuit')?.disable();
  }

  cancelarEdicion(): void {
    this.editando = null;
    this.contribuyenteForm.reset();
    this.contribuyenteForm.get('cuit')?.enable();
  }

  eliminarContribuyente(contribuyente: Contribuyente): void {
    this.dialogService.confirm('¿Seguro Que Quieres Eliminar El Contribuyente CUIT ' + contribuyente.cuit + '?').subscribe(result => {
      if (result) {
        this.contribuyenteService.eliminarContribuyente(contribuyente.cuit).subscribe(() => {
          this.contribuyenteService.showSuccessMessage('Contribuyente CUIT ' + contribuyente.cuit + ' Eliminado Con Éxito', 5);
          this.utils.guardarLog(this.menuData?.empleadoLogueado?.nombre, 'Contribuyente CUIT ' + JSON.stringify(contribuyente) + ' Eliminado Con Éxito');
          this.loadContribuyentes();
        });
      }
    });
  }

  updatePaginator(): void {
    setTimeout(() => {
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
        this.paginator._changePageSize(this.paginator.pageSize);
      }
    });
  }
}
