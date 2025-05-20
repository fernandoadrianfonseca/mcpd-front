import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Categoria } from '../../models/categoria.model';
import { CategoriaService } from '../../services/rest/categoria/categoria.service';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../modules/material/material.module';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { DialogService } from '../../services/dialog/dialog.service';
import { UtilsService } from '../../services/utils/utils.service';

@Component({
  selector: 'categoria-form',
  templateUrl: './categoria-form.component.html',
  styleUrls: ['./categoria-form.component.scss'],
  imports: [CommonModule, MaterialModule, ReactiveFormsModule]
})
export class CategoriaFormComponent implements OnInit {
  categoriaForm!: FormGroup;
  categorias: Categoria[] = [];
  displayedColumns: string[] = ['nombre', 'acciones'];
  dataSource = new MatTableDataSource<Categoria>();

  categoriaEditando: Categoria | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private fb: FormBuilder,
               private categoriaService: CategoriaService,
                private dialogService: DialogService,
                 private utils: UtilsService,
                  @Inject('menuData') public menuData: any) {}

  ngOnInit(): void {
    this.categoriaForm = this.fb.group({
      nombre: ['', Validators.required]
    });

    this.loadCategorias();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  onSubmit(): void {
    if (this.categoriaForm.valid) {
      const categoria: Categoria = {
        id: this.categoriaEditando ? this.categoriaEditando.id : undefined,
        nombre: this.categoriaForm.value.nombre
      };

      if (this.categoriaEditando) {
        this.categoriaService.actualizarCategoria(categoria.id!, categoria).subscribe(() => {
          this.categoriaService.showSuccessMessage('Categoría Actualizada Con Éxito', 5);
          this.utils.guardarLog(this.menuData?.empleadoLogueado?.nombre, 'Categoria Actualizada ' + JSON.stringify(categoria));
          this.cancelarEdicion();
          this.loadCategorias();
        });
      } else {
        this.categoriaService.crearCategoria(categoria).subscribe(() => {
          this.categoriaService.showSuccessMessage('Categoría Guardada Con Éxito', 5);
          this.utils.guardarLog(this.menuData?.empleadoLogueado?.nombre, 'Categoria Guardada ' + JSON.stringify(categoria));
          this.cancelarEdicion();
          this.loadCategorias();
        });
      }
    }
  }

  editarCategoria(categoria: Categoria): void {
    this.categoriaEditando = categoria;
    this.categoriaForm.patchValue({
      nombre: categoria.nombre
    });
  }

  cancelarEdicion(): void {
    this.categoriaEditando = null;
    this.categoriaForm.reset();
  }

  eliminarCategoria(categoria: Categoria): void {
    this.dialogService.confirm('¿Seguro Que Quieres Eliminar Esta Categoría?').subscribe(result => {
      if (result) {
        this.categoriaService.eliminarCategoria(categoria.id ?? 0).subscribe(() => {
          this.categoriaService.showSuccessMessage('Categoría Eliminada Con Éxito', 5);
          this.utils.guardarLog(this.menuData?.empleadoLogueado?.nombre, 'Categoria Eliminada ' + JSON.stringify(categoria));
          this.loadCategorias();
        });
      }
    });
  }

  loadCategorias(): void {
    this.categoriaService.getCategorias().subscribe(data => {
      this.categorias = data;
      this.dataSource.data = this.categorias;
      this.dataSource.sort = this.sort; // ✅ Aseguramos que se asigne después de obtener datos
      this.updatePaginator(); // ✅ Agregamos función para actualizar paginador
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = filterValue;
  }

  updatePaginator(): void {
    setTimeout(() => {
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
        this.paginator._changePageSize(this.paginator.pageSize); // ✅ Forzar actualización
      }
    });
  }
}
