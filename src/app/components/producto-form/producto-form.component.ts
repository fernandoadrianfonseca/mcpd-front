import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule  } from '@angular/forms';
import { Producto } from '../../models/producto.model';
import { ProductoService } from '../../services/rest/producto/producto.service';
import { CategoriaService } from '../../services/rest/categoria/categoria.service';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../modules/material/material.module';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'producto-form',
  templateUrl: './producto-form.component.html',
  styleUrls: ['./producto-form.component.scss'],
  imports: [CommonModule, MaterialModule, ReactiveFormsModule ]
})

export class ProductoFormComponent implements OnInit {
  productoForm!: FormGroup;
  categorias: any[] = [];
  productos: Producto[] = [];
  displayedColumns: string[] = ['nombre', 'categoriaNombre'];
  dataSource = new MatTableDataSource<Producto>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private fb: FormBuilder, private productoService: ProductoService, private categoriaService: CategoriaService) {}

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

  onSubmit(): void {
    if (this.productoForm.valid) {
      const producto: Producto = {
        nombre: this.productoForm.value.nombre,
        categoria: this.productoForm.value.categoria,
        categoriaNombre: this.categorias.find(cat => cat.id === this.productoForm.value.categoria)?.nombre || ''
      };

      this.productoService.crearProducto(producto).subscribe(() => {
        alert('Producto guardado con éxito');
        this.productoForm.reset();
        this.loadProductos(); // Recargar la lista después de agregar un producto
      });
    }
  }

  loadProductos(): void {
    this.productoService.getProductos().subscribe(data => {
      this.productos = data;
      this.dataSource.data = this.productos;
      this.dataSource.paginator = this.paginator;
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = filterValue;
  }

  filterByCategory(categoryId: number): void {
    if (categoryId) {
      this.dataSource.data = this.productos.filter(producto => producto.categoria === categoryId);
    } else {
      this.dataSource.data = this.productos;
    }
  }
}