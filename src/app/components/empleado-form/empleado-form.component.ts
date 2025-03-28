import { Component, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Empleado } from '../../models/empleado.model';
import { EmpleadoService } from '../../services/rest/empleado/empleado.service';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../modules/material/material.module';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { ContribuyenteService } from '../../services/rest/contribuyente/contribuyente.service';
import { Contribuyente } from '../../models/contribuyente.model';

@Component({
  selector: 'app-empleado-form',
  templateUrl: './empleado-form.component.html',
  styleUrls: ['./empleado-form.component.scss'],
  imports: [CommonModule, MaterialModule, ReactiveFormsModule, FormsModule]
})
export class EmpleadoFormComponent implements OnInit {
  empleadoForm!: FormGroup;
  empleados: Empleado[] = [];
  displayedColumns: string[] = ['legajo', 'cuil', 'nombre', 'categoria', 'agrupamiento', 'dependencia','sistema', 'acciones'];
  dataSource = new MatTableDataSource<Empleado>();
  editando: Empleado | null = null;
  contribuyentes: Contribuyente[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dependencias: string[] = [
    "Patrimonio", "Rentas", "Despacho", "Gobierno", "Catastro", "Archivo",
    "Hacienda", "Contaduria", "RRHH", "Bromatologia", "Informatica",
    "Pedidos", "Recaudacion", "Obras", "Liquidacion", "PENDIENTE",
    "Tesoreria", "Compras"
  ];

  constructor(private fb: FormBuilder, private empleadoService: EmpleadoService, private contribuyenteService: ContribuyenteService) {}

  ngOnInit(): void {
    this.empleadoForm = this.fb.group({
      legajo: ['', [Validators.required, Validators.min(1), this.validarLegajoUnico.bind(this)]],
      cuil: ['', [Validators.required,
                  Validators.minLength(11),
                  Validators.maxLength(11),
                  this.validarCuilUnico.bind(this),
                  this.validarCuilExistente.bind(this)]],
      categoria: ['', Validators.required],
      agrupamiento: ['', Validators.required],
      dependencia: ['', Validators.required],
      sistema: ['', Validators.required]
    });
    this.loadContribuyentes();
    this.loadEmpleados();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(event: Event, column: keyof Empleado) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filterPredicate = (data: Empleado, filter: string) =>
      (data[column] as unknown as string)?.toString().toLowerCase().includes(filter);
    this.dataSource.filter = filterValue;
  }
  
  filterByDependencia(dependencia: string) {
    this.dataSource.filterPredicate = (data: Empleado, filter: string) =>
      dependencia ? data.dependencia === filter : true;
    this.dataSource.filter = dependencia;
  }

  loadContribuyentes() :void {
    this.contribuyenteService.getContribuyentes().subscribe(data => {
      this.contribuyentes = data;
    });
  }

  validarCuilExistente(control: AbstractControl) {
    const cuil = control.value;
    if (!cuil || cuil.toString().length !== 11) {
      return null;
    }
    const existe = this.contribuyentes.some(c => c.cuit === +cuil);
    return existe ? null : { cuilInexistente: true };
  }

  validarLegajoUnico(control: AbstractControl) {
    const legajo = control.value;
    if (!legajo || this.editando?.legajo === legajo) {
      return null;
    }
    const existe = this.empleados.some(e => e.legajo === legajo);
    return existe ? { legajoDuplicado: true } : null;
  }
  
  validarCuilUnico(control: AbstractControl) {
    const cuil = control.value;
    if (!cuil || this.editando?.cuil == cuil) {
      return null;
    }
    const existe = this.empleados.some(e => e.cuil == cuil);
    return existe ? { cuilDuplicado: true } : null;
  }

  loadEmpleados(): void {
    this.empleadoService.getEmpleados().subscribe(data => {
      this.empleados = data;
      this.dataSource.data = this.empleados;
      this.updatePaginator();
      this.dataSource.sort = this.sort;
    });
  }

  onSubmit(): void {
    this.empleadoForm.get('legajo')?.enable();
    this.empleadoForm.get('cuil')?.enable();
    if (this.empleadoForm.valid) {
      const empleado: Empleado = { ...this.empleadoForm.value };
  
      if (this.editando) {
        this.empleadoService.actualizarEmpleado(empleado.legajo, empleado).subscribe(() => {
          alert('Empleado actualizado con éxito');
          this.loadEmpleados();
          this.cancelarEdicion();
        });
      } else {
        this.empleadoService.crearEmpleado(empleado).subscribe(() => {
          alert('Empleado agregado con éxito');
          this.loadEmpleados();
          this.cancelarEdicion();
        });
      }
    }
  }

  editarEmpleado(empleado: Empleado): void {
    this.editando = empleado;
    this.empleadoForm.patchValue(empleado);
    this.empleadoForm.get('legajo')?.disable();
    this.empleadoForm.get('cuil')?.disable();
  }

  cancelarEdicion(): void {
    this.editando = null;
    this.empleadoForm.reset();
    this.empleadoForm.get('legajo')?.enable();
    this.empleadoForm.get('cuil')?.enable();
  }

  eliminarEmpleado(legajo: number): void {
    if (confirm('¿Seguro que quieres eliminar este empleado?')) {
      this.empleadoService.eliminarEmpleado(legajo).subscribe(() => {
        alert('Empleado eliminado con éxito');
        this.loadEmpleados();
      });
    }
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

