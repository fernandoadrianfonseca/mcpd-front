import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Proveedor } from '../../models/proveedor.model';
import { ProveedorService } from '../../services/rest/proveedor/proveedor.service';
import { ContribuyenteService } from '../../services/rest/contribuyente/contribuyente.service';
import { Contribuyente } from '../../models/contribuyente.model';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../modules/material/material.module';

@Component({
  selector: 'app-proveedor-form',
  templateUrl: './proveedor-form.component.html',
  styleUrls: ['./proveedor-form.component.scss'],
  imports: [CommonModule, MaterialModule, ReactiveFormsModule, FormsModule]
})
export class ProveedorFormComponent implements OnInit {
  proveedorForm!: FormGroup;
  proveedores: Proveedor[] = [];
  contribuyentes: Contribuyente[] = [];
  displayedColumns: string[] = ['cuit', 'nombre', 'fantasia', 'acciones'];
  dataSource = new MatTableDataSource<Proveedor>();
  editando: Proveedor | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private fb: FormBuilder,
    private proveedorService: ProveedorService,
    private contribuyenteService: ContribuyenteService
  ) {}

  ngOnInit(): void {
    this.proveedorForm = this.fb.group({
      cuit: ['', [Validators.required,
                    Validators.pattern(/^\d{11}$/),
                      this.validarCuitExistente.bind(this),
                        this.validarCuitProveedorUnico.bind(this)]],
      nombreFantasia: ['', Validators.required]
    });

    this.loadContribuyentes();
    this.loadProveedores();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  validarCuitExistente(control: AbstractControl) {
    const cuit = control.value;
    if (!cuit || this.editando) return null;
    if (cuit.toString().length !== 11) return null;
    const existe = this.contribuyentes.some(c => c.cuit === +cuit);
    return existe ? null : { cuitInexistente: true };
  }

  validarCuitProveedorUnico(control: AbstractControl) {
    const cuit = control.value;
    if (!cuit || this.editando) return null; 
    if (cuit.toString().length !== 11) return null;
  
    const existe = this.proveedores.some(p => p.cuit === +cuit);
    return existe ? { cuitDuplicado: true } : null;
  }

  loadContribuyentes(): void {
    this.contribuyenteService.getContribuyentes().subscribe(data => {
      this.contribuyentes = data;
    });
  }

  loadProveedores(): void {
    this.proveedorService.getProveedores().subscribe(data => {
      this.proveedores = data;
      this.dataSource.data = this.proveedores;
      this.dataSource.sort = this.sort;
      this.updatePaginator();
    });
  }

  onSubmit(): void {

    this.proveedorForm.get('cuit')?.enable();
    if (this.proveedorForm.valid) {
      const proveedor: Proveedor = { ...this.proveedorForm.value };

      if (this.editando) {
        this.proveedorService.actualizarProveedor(proveedor.cuit, proveedor).subscribe(() => {
          this.proveedorService.showSuccessMessage('Proveedor actualizado con éxito', 5);
          this.loadProveedores();
          this.cancelarEdicion();
        });
      } else {
        this.proveedorService.crearProveedor(proveedor).subscribe(() => {
          this.proveedorService.showSuccessMessage('Proveedor creado con éxito', 5);
          this.loadProveedores();
          this.cancelarEdicion();
        });
      }
    }
  }

  editarProveedor(proveedor: Proveedor): void {
    this.editando = proveedor;
    this.proveedorForm.patchValue(proveedor);
    this.proveedorForm.get('cuit')?.disable();
  }

  cancelarEdicion(): void {
    this.editando = null;
    this.proveedorForm.reset();
    this.proveedorForm.get('cuit')?.enable();
  }

  applyFilter(event: Event, column: keyof Proveedor): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filterPredicate = (data: Proveedor, filter: string) =>
      (data[column] as unknown as string)?.toString().toLowerCase().includes(filter);
    this.dataSource.filter = filterValue;
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
