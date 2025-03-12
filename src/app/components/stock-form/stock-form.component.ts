import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../modules/material/material.module';
import { ProductosStock } from '../../models/stock.model';
import { StockService } from '../../services/rest/stock/stock.service';
import { CategoriaService } from '../../services/rest/categoria/categoria.service';
import { ProductoService } from '../../services/rest/producto/producto.service';
import { Categoria } from '../../models/categoria.model';
import { Producto } from '../../models/producto.model';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'stock-form',
  templateUrl: './stock-form.component.html',
  styleUrls: ['./stock-form.component.scss'],
  imports: [CommonModule, MaterialModule, ReactiveFormsModule, FormsModule]
})
export class StockFormComponent implements OnInit, AfterViewInit {
  stockForm!: FormGroup;
  categorias: Categoria[] = [];
  productos: Producto[] = [];
  stockItems: ProductosStock[] = [];
  displayedColumns: string[] = ['categoriaNombre', 'productoNombre','cantidad', 'unidades', 'marca', 'modelo', 'detalle', 'numeroDeSerie', 'tipo', 'acciones'];
  dataSource = new MatTableDataSource<ProductosStock>();

  stockEditando: ProductosStock | null = null;
  categoriaControl = new FormControl('');
  productoControl = new FormControl('');
  filteredCategorias!: Observable<Categoria[]>;
  filteredProductos!: Observable<Producto[]>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private fb: FormBuilder,
    private stockService: StockService,
    private categoriaService: CategoriaService,
    private productoService: ProductoService
  ) {}

  ngOnInit(): void {
    this.stockForm = this.fb.group({
      categoria: ['', Validators.required],
      producto: [{ value: '', disabled: true }, Validators.required],
      cantidad: ['', [Validators.required, Validators.min(1)]],
      unidades: ['', [Validators.required, Validators.min(1)]],
      marca: [''],
      modelo: [''],
      detalle: [''],
      numeroDeSerie: [''],
      tipo: ['', Validators.required],
      observaciones: ['']
    });

    this.categoriaService.getCategorias().subscribe(data => {
      this.categorias = data;
      this.filteredCategorias = this.categoriaControl.valueChanges.pipe(
        startWith(''),
        map(value => this.filterList(value, this.categorias))
      );
    });

    // Obtener productos
    this.productoService.getProductos().subscribe(data => {
      this.productos = data;
      this.filteredProductos = this.productoControl.valueChanges.pipe(
        startWith(''),
        map(value => this.filterList(value, this.productos))
      );
    });

    this.loadStock();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  filterList(value: string | null, list: any[]): any[] {
    const filterValue = (value ?? '').toLowerCase();
    return list.filter(item => item.nombre.toLowerCase().includes(filterValue));
  }

  /** ✅ Cambiar productos al seleccionar categoría */
  onCategoriaChange(event: any): void {
    const categoria: Categoria = event.option.value; 
    if (categoria) {
      this.stockForm.controls['categoria'].setValue(categoria.id); 
      this.stockForm.controls['producto'].enable();
      this.filteredProductos = this.productoControl.valueChanges.pipe(
        startWith(''),
        map(value => this.filterList(value, this.productos.filter(prod => prod.categoria.id === categoria.id)))
      );
    } else {
      this.stockForm.controls['producto'].disable();
      this.productoControl.setValue('');
    }
  }

  /** ✅ Manejar selección de producto */
  onProductoChange(event: any): void {
    const producto: Producto = event.option.value; 
    if (producto) {
      this.stockForm.controls['producto'].setValue(producto.id); 
    }
  }

  /** ✅ Crear o actualizar stock */
  onSubmit(): void {
    if (this.stockForm.valid) {

      const categoria = this.stockForm.value.categoria as Categoria;
      const categoriaId = categoria.id;
      const categoriaNombre = categoria.nombre;

      const producto = this.stockForm.value.producto as Producto;
      const productoId = producto.id;
      const productoNombre = producto.nombre;

      const stock: ProductosStock = {
        id: this.stockEditando ? this.stockEditando.id : undefined,
        categoria: { id: categoriaId, nombre: categoriaNombre },
        categoriaNombre: categoriaNombre,
        producto: { id: productoId, nombre: productoNombre, categoria: { id: categoriaId, nombre: categoriaNombre }, categoriaNombre: categoriaNombre },
        productoNombre: productoNombre,
        cantidad: this.stockForm.value.cantidad, 
        unidades: this.stockForm.value.unidades,
        tipo: this.stockForm.value.tipo,
        marca: this.stockForm.value.marca,
        modelo: this.stockForm.value.modelo,
        numeroDeSerie: this.stockForm.value.numeroDeSerie,
        detalle: this.stockForm.value.detalle,
        ordenDeCompra: this.stockForm.value.ordenDeCompra,
        remito: this.stockForm.value.remito,
        custodia: this.stockForm.value.custodia,
        acta: this.stockForm.value.acta,
        transfiere: this.stockForm.value.transfiere,
        motivoBaja: this.stockForm.value.motivoBaja,
        fechaDeDevolucion: this.stockForm.value.fechaDeDevolucion,
        observaciones: this.stockForm.value.observaciones
    };

      if (this.stockEditando) {
        this.stockService.actualizarStock(stock.id!, stock).subscribe(() => {
          alert('Stock actualizado con éxito');
          this.cancelarEdicion();
          this.loadStock();
        });
      } else {
        this.stockService.crearStock(stock).subscribe(() => {
          alert('Stock guardado con éxito');
          this.cancelarEdicion();
          this.loadStock();
        });
      }
    }
  }

  /** ✅ Cargar stock en la tabla */
  loadStock(): void {
    this.stockService.getStock().subscribe(data => {
      this.stockItems = data;
      this.dataSource.data = this.stockItems;
      this.updatePaginator();
    });
  }

  /** ✅ Cargar datos en el formulario para edición */
  editarStock(stock: ProductosStock): void {
    this.stockEditando = stock;
  
    // Buscar la categoría en la lista
    const categoria = this.categorias.find(cat => cat.id === stock.categoria.id) || null;
  
    // Buscar el producto en la lista
    const producto = this.productos.find(prod => prod.id === stock.producto.id) || null;
  
    // Actualizar los valores en el formulario con el ID de la categoría y producto
    this.stockForm.patchValue({
      categoria: categoria?.id || '',
      producto: producto?.id || '',
      cantidad: stock.cantidad,
      unidades: stock.unidades,
      tipo: stock.tipo,
      marca: stock.marca,
      modelo: stock.modelo,
      numeroDeSerie: stock.numeroDeSerie,
      detalle: stock.detalle,
      ordenDeCompra: stock.ordenDeCompra,
      remito: stock.remito,
      custodia: stock.custodia,
      acta: stock.acta,
      transfiere: stock.transfiere,
      motivoBaja: stock.motivoBaja,
      fechaDeDevolucion: stock.fechaDeDevolucion,
      observaciones: stock.observaciones
    });
  
    // **Forzar el cambio en los autocompletes**
    if (categoria) {
      this.categoriaControl.setValue(categoria.nombre); 
      this.onCategoriaChange({ option: { value: categoria.id } });
    }
  
    if (producto) {
      this.productoControl.setValue(producto.nombre);
    }
  }

  /** ✅ Cancelar edición */
  cancelarEdicion(): void {
    this.stockEditando = null;
    this.stockForm.reset();
    this.stockForm.controls['producto'].disable();
  }

  /** ✅ Eliminar un stock */
  eliminarStock(id: number): void {
    if (confirm('¿Seguro que quieres eliminar este stock?')) {
      this.stockService.eliminarStock(id).subscribe(() => {
        alert('Stock eliminado con éxito');
        this.loadStock();
      });
    }
  }

  /** ✅ Actualiza el paginador */
  updatePaginator(): void {
    setTimeout(() => {
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
        this.paginator._changePageSize(this.paginator.pageSize);
      }
    });
  }

  displayCategoria(categoria?: Categoria): string {
    return categoria ? categoria.nombre : '';
  }
  
  displayProducto(producto?: Producto): string {
    return producto ? producto.nombre : '';
  }
}
