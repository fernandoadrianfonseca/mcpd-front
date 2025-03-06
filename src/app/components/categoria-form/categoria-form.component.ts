import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Categoria } from '../../models/categoria.model';
import { CategoriaService } from '../../services/rest/categoria/categoria.service';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../modules/material/material.module';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

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

  constructor(private fb: FormBuilder, private categoriaService: CategoriaService) {}

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
          alert('Categoría actualizada con éxito');
          this.cancelarEdicion();
          this.loadCategorias();
        });
      } else {
        this.categoriaService.crearCategoria(categoria).subscribe(() => {
          alert('Categoría guardada con éxito');
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

  eliminarCategoria(id: number): void {
    if (confirm('¿Seguro que quieres eliminar esta categoría?')) {
      this.categoriaService.eliminarCategoria(id).subscribe(() => {
        alert('Categoría eliminada con éxito');
        this.loadCategorias();
      });
    }
  }

  loadCategorias(): void {
    this.categoriaService.getCategorias().subscribe(data => {
      this.categorias = data;
      this.dataSource.data = this.categorias;
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
