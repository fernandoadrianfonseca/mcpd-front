import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Producto } from '../../models/producto.model';
import { ProductoService } from '../../services/rest/producto/producto.service';
import { CategoriaService } from '../../services/rest/categoria/categoria.service';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../modules/material/material.module';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { DialogService } from '../../services/dialog/dialog.service';

@Component({
  selector: 'producto-form',
  templateUrl: './producto-form.component.html',
  styleUrls: ['./producto-form.component.scss'],
  imports: [CommonModule, MaterialModule, ReactiveFormsModule]
})
export class ProductoFormComponent implements OnInit {
  productoForm!: FormGroup;
  categorias: any[] = [];
  productos: Producto[] = [];
  displayedColumns: string[] = ['nombre', 'categoriaNombre', 'acciones'];
  dataSource = new MatTableDataSource<Producto>();

  productoEditando: Producto | null = null; // ✅ Variable para controlar edición

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private fb: FormBuilder,
                private productoService: ProductoService,
                  private categoriaService: CategoriaService,
                    private dialogService: DialogService) {}

  ngOnInit(): void {
    this.productoForm = this.fb.group({
      nombre: ['', Validators.required],
      categoria: ['', Validators.required]
    });

    this.categoriaService.getCategorias().subscribe(data => {
      this.categorias = data;
    });

    this.loadProductos();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  /** ✅ Método para manejar la creación o edición de un producto */
  onSubmit(): void {
    if (this.productoForm.valid) {
      const categoriaId = this.productoForm.value.categoria;
      const categoriaNombre = this.categorias.find(cat => cat.id === categoriaId)?.nombre || '';

      const producto: Producto = {
        id: this.productoEditando ? this.productoEditando.id : undefined, // Si se edita, usa el ID
        nombre: this.productoForm.value.nombre,
        categoria: { id: categoriaId, nombre: categoriaNombre }, 
        categoriaNombre: categoriaNombre
      };

      if (this.productoEditando) {
        // ✅ Si se está editando, actualiza el producto
        this.productoService.actualizarProducto(producto.id!, producto).subscribe(() => {
          this.productoService.showSuccessMessage('Producto Actualizado Con Éxito', 5);
          this.cancelarEdicion(); // Reinicia el formulario
          this.loadProductos();
        });
      } else {
        // ✅ Si no, crea un nuevo producto
        this.productoService.crearProducto(producto).subscribe(() => {
          this.productoService.showSuccessMessage('Producto Guardado Con Éxito',5);
          this.cancelarEdicion(); // Reinicia el formulario
          this.loadProductos();
        });
      }
    }
  }

  /** ✅ Método para cargar un producto al formulario para su edición */
  editarProducto(producto: Producto): void {
    this.productoEditando = producto;
    this.productoForm.patchValue({
      nombre: producto.nombre,
      categoria: producto.categoria.id
    });
  }

  /** ✅ Método para cancelar la edición y limpiar el formulario */
  cancelarEdicion(): void {
    this.productoEditando = null;
    this.productoForm.reset();
  }

  /** ✅ Método para eliminar un producto */
  eliminarProducto(id: number): void {
    this.dialogService.confirm('¿Seguro Que Quieres Eliminar Este Producto?').subscribe(result => {
      if (result) {
        this.productoService.eliminarProducto(id).subscribe(() => {
          this.productoService.showSuccessMessage('Producto Eliminado Con Éxito', 5);
          this.loadProductos();
        });
      }
    });
  }

  /** ✅ Método para cargar productos en la tabla */
  loadProductos(): void {
    this.productoService.getProductos().subscribe(data => {
      this.productos = data;
      this.dataSource.data = this.productos;
      this.dataSource.sort = this.sort; // ✅ Aseguramos que se asigne después de obtener datos
      this.updatePaginator(); // ✅ Agregamos función para actualizar paginador
    });
  }

  /** ✅ Filtrar productos por nombre */
  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = filterValue;
  }

  /** ✅ Filtrar productos por categoría */
  filterByCategory(categoryId: number): void {
    if (categoryId) {
      this.dataSource.data = this.productos.filter(producto => producto.categoria.id === categoryId);
    } else {
      this.dataSource.data = this.productos;
    }
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
