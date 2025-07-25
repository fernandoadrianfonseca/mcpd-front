import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Empleado } from '../../models/empleado.model';
import { EmpleadoService } from '../../services/rest/empleado/empleado.service';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../modules/material/material.module';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { ContribuyenteService } from '../../services/rest/contribuyente/contribuyente.service';
import { Contribuyente } from '../../models/contribuyente.model';
import { DialogService } from '../../services/dialog/dialog.service';
import { StockFormComponent } from '../stock-form/stock-form.component';
import { UtilsService } from '../../services/utils/utils.service';
import { StockService } from '../../services/rest/stock/stock.service';
import { ListadoDialogComponent } from '../listado-dialog/listado-dialog.component';
import { MatDialog } from '@angular/material/dialog';

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

  modoCustodia = false;

  constructor(private fb: FormBuilder,
               private empleadoService: EmpleadoService,
                private contribuyenteService: ContribuyenteService,
                  private dialogService: DialogService,
                   private utils: UtilsService,
                    private stockService: StockService,
                      private dialog: MatDialog,
                        @Inject('menuData') public menuData: any) {}

  ngOnInit(): void {
    this.modoCustodia = this.menuData?.modoCustodia || false;
    this.displayedColumns = this.modoCustodia
                                              ? ['legajo', 'cuil', 'nombre', 'categoria', 'agrupamiento', 'dependencia','sistema', 'accionesCustodia']
                                              : ['legajo', 'cuil', 'nombre', 'categoria', 'agrupamiento', 'dependencia','sistema', 'acciones'];
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
          this.empleadoService.showSuccessMessage('Empleado Legajo ' + empleado.legajo +' Actualizado Con Éxito', 5);
          this.utils.guardarLog(this.menuData?.empleadoLogueado?.nombre, 'Empleado Legajo ' + empleado.legajo +' Actualizado');
          this.loadEmpleados();
          this.cancelarEdicion();
        });
      } else {
        this.empleadoService.crearEmpleado(empleado).subscribe(() => {
          this.empleadoService.showSuccessMessage('Empleado Legajo ' + empleado.legajo + ' Agregado Con Éxito', 5);
          this.utils.guardarLog(this.menuData?.empleadoLogueado?.nombre, 'Empleado Legajo ' + empleado.legajo + ' Agregado');
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

  eliminarEmpleado(empleado: Empleado): void {
    this.dialogService.confirm('¿Seguro Que Quieres Eliminar El Empleado Legajo ' + empleado.legajo + '?').subscribe(result => {
      if (result) {
        this.empleadoService.eliminarEmpleado(empleado.legajo).subscribe(() => {
          this.empleadoService.showSuccessMessage('Empleado Legajo ' + empleado.legajo + ' Eliminado Con Éxito', 5);
          this.utils.guardarLog(this.menuData?.empleadoLogueado?.nombre, 'Empleado ' + JSON.stringify(empleado) + ' Eliminado');
          this.loadEmpleados();
        });
      }
    });
  }

  confirmarBlanqueo(empleado: Empleado): void {
    this.dialogService.confirm(`¿Está Seguro Que desea Blanquear El Password Del Empleado Con Legajo ${empleado.legajo}?`)
      .subscribe(result => {
        if (result) {
          this.empleadoService.blanquearPassword(empleado.legajo).subscribe(() => {
            this.empleadoService.showSuccessMessage(`Password Del Empleado Legajo ${empleado.legajo} Blanqueado Con Éxito`, 5);
            this.utils.guardarLog(this.menuData?.empleadoLogueado?.nombre, 'Password Del Empleado ' + JSON.stringify(empleado) + ' Blanqueado');
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

  listarStock(empleado: Empleado) {
    const data = { modoCustodia: true, empleado: empleado, empleadoLogueado: this.menuData?.empleadoLogueado };
    window.dispatchEvent(new CustomEvent('navegarComponente', {
      detail: {
        componente: StockFormComponent,
        data: data
      }
    }));
  }

  abrirHerramientas(empleado: Empleado){

     this.stockService.getPrestamosPendientesDeDevolucion(empleado.legajo).subscribe(pendientes => {
      const rows = pendientes.map(p => ({
        ...p,
        producto: `${p.flujo.productoStock.productoNombre} ${p.flujo.productoStock.detalle ?? ''} ${p.flujo.productoStock.marca ?? ''}`.trim(),
        fechaDevolucion: p.fechaDevolucion ?? '-'
      }));

      this.dialog.open(ListadoDialogComponent, {
        width: '1300px',
        data: {
          title: `Herramientas Pendientes de Devolución – Legajo ${empleado.legajo}`,
          columns: ['producto', 'cantidadPendiente', 'fechaDevolucion', 'estadoDevolucion'],
          columnNames: {
            producto: 'Producto',
            cantidadPendiente: 'Cantidad Pendiente',
            fechaDevolucion: 'Fecha Devolución',
            estadoDevolucion: 'Estado Devolución'
          },
          rows: rows,
          filterableColumns: ['all']
        }
      });
    });
  }
  
  asignarStock(empleado: Empleado) {
    const data = { modoAsignar: true, empleado: empleado, empleadoLogueado: this.menuData?.empleadoLogueado };
    window.dispatchEvent(new CustomEvent('navegarComponente', {
      detail: {
        componente: StockFormComponent,
        data: data
      }
    }));
  }
  
  quitarStock(empleado: Empleado) {
    const data = { modoQuitar: true, empleado: empleado, empleadoLogueado: this.menuData?.empleadoLogueado };
    window.dispatchEvent(new CustomEvent('navegarComponente', {
      detail: {
        componente: StockFormComponent,
        data: data
      }
    }));
  }
  
  transferirStock(empleado: Empleado) {
    const data = { modoTransferir: true, empleado: empleado, empleadoLogueado: this.menuData?.empleadoLogueado };
    window.dispatchEvent(new CustomEvent('navegarComponente', {
      detail: {
        componente: StockFormComponent,
        data: data
      }
    }));
  }
}

