import { Component, OnInit, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
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
import { MatSort } from '@angular/material/sort';
import { DialogService } from '../../services/dialog/dialog.service';

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
  displayedColumns: string[] = ['categoriaNombre', 'productoNombre', 'detalle', 'cantidad', 'unidades', 'tipo', 'marca', 'modelo', 'numeroDeSerie', 'acciones'];
  dataSource = new MatTableDataSource<ProductosStock>();

  stockEditando: ProductosStock | null = null;
  filteredCategorias!: Observable<Categoria[]>;
  filteredProductos!: Observable<Producto[]>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private fb: FormBuilder,
    private stockService: StockService,
    private categoriaService: CategoriaService,
    private productoService: ProductoService,
    private dialogService: DialogService
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
      this.filteredCategorias = this.stockForm.controls['categoria'].valueChanges.pipe(
        startWith(''),
        map(value => this.filterList(value, this.categorias))
      );
    });

    // Obtener productos
    this.productoService.getProductos().subscribe(data => {
      this.productos = data;
      this.filteredProductos = this.stockForm.controls['producto'].valueChanges.pipe(
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
    const filterValue = (typeof value === 'string' ? value.toLowerCase() : '');
    return list.filter(item => item.nombre.toLowerCase().includes(filterValue));
  }

  /** ✅ Cambiar productos al seleccionar categoría */
  onCategoriaChange(event: any): void {
    const categoria: Categoria = event.option.value; 
    if (categoria) {
      this.stockForm.controls['categoria'].setValue(categoria); 
      this.stockForm.controls['producto'].enable();
      this.filteredProductos = this.stockForm.controls['producto'].valueChanges.pipe(
        startWith(''),
        map(value => this.filterList(value, this.productos.filter(prod => prod.categoria.id === categoria.id)))
      );
    } else {
      this.stockForm.controls['producto'].disable();
      this.stockForm.controls['producto'].setValue('');
    }
  }

  /** ✅ Manejar selección de producto */
  onProductoChange(event: any): void {
    const producto: Producto = event.option.value; 
    if (producto) {
      this.stockForm.controls['producto'].setValue(producto); 
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
          this.stockService.showSuccessMessage('Stock actualizado con éxito', 5);
          this.cancelarEdicion();
          this.loadStock();
        });
      } else {
        this.stockService.crearStock(stock).subscribe(() => {
          this.stockService.showSuccessMessage('Stock guardado con éxito', 5);
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
      this.dataSource.sort = this.sort; // ✅ Aseguramos que se asigne después de obtener datos
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
      categoria: categoria ? categoria : null,
      producto: producto ? producto : null,
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
  
    // ✅ **Actualizar `mat-autocomplete` correctamente**
    this.stockForm.controls['categoria'].setValue(categoria ? categoria as any : '');
    this.stockForm.controls['producto'].setValue(producto ? producto as any : '');

    // ✅ **Forzar actualización de productos**
    if (categoria) {
      this.onCategoriaChange({ option: { value: categoria } });
    }

    // ✅ **Habilitar el campo producto**
    this.stockForm.controls['producto'].enable();

  }

  /** ✅ Cancelar edición */
  cancelarEdicion(): void {
    
    this.stockEditando = null;
    this.stockForm.reset();

     // ✅ Limpia visualmente el campo de categoría y producto
     this.stockForm.controls['categoria'].setValue('');
     this.stockForm.controls['producto'].setValue('');

    // ✅ Restablece los valores del formulario para evitar problemas con los validadores
    this.stockForm.patchValue({
      categoria: '',
      producto: '',
      cantidad: '',
      unidades: '',
      marca: '',
      modelo: '',
      detalle: '',
      numeroDeSerie: '',
      tipo: '',
      observaciones: ''
    });
    this.stockForm.controls['producto'].disable();
  }

  /** ✅ Eliminar un stock */
  eliminarStock(id: number): void {
    this.dialogService.confirm('¿Seguro Que Quieres Eliminar Este Stock?').subscribe(result => {
      if (result) {
        this.stockService.eliminarStock(id).subscribe(() => {
          this.stockService.showSuccessMessage('Stock Eliminado Con Éxito', 5);
          this.loadStock();
        });
      }
    });
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

  /** ✅ Filtrar por categoría */
  filterByCategory(category: string): void {
    this.dataSource.filterPredicate = (data, filter) => {
      return category ? data.categoriaNombre === category : true;
    };
    this.dataSource.filter = category; // Activa el filtro
  }

  /** ✅ Filtrar por producto */
  applyProductFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filterPredicate = (data, filter) => data.productoNombre.toLowerCase().includes(filter);
    this.dataSource.filter = filterValue;
  }

  /** ✅ Filtrar por detalle */
  applyDetailFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filterPredicate = (data, filter) =>
      (data.detalle?.toLowerCase() || '').includes(filter);
    this.dataSource.filter = filterValue;
  }
}
