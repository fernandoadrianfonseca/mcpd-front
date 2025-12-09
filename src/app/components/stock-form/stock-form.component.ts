import { Component, OnInit, ViewChild, AfterViewInit, Inject, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, AbstractControl, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DynamicFormDialogComponent } from '../../components/dynamic-form-dialog/dynamic-form-dialog.component';
import { MaterialModule } from '../../modules/material/material.module';
import { ProductosStock } from '../../models/stock.model';
import { StockService } from '../../services/rest/stock/stock.service';
import { CategoriaService } from '../../services/rest/categoria/categoria.service';
import { ProductoService } from '../../services/rest/producto/producto.service';
import { Categoria } from '../../models/categoria.model';
import { Producto } from '../../models/producto.model';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { forkJoin, lastValueFrom, Observable, of, throwError } from 'rxjs';
import { catchError, map, startWith, timeout } from 'rxjs/operators';
import { MatSort } from '@angular/material/sort';
import { DialogService } from '../../services/dialog/dialog.service';
import { EmpleadoService } from '../../services/rest/empleado/empleado.service';
import { Empleado } from '../../models/empleado.model';
import { MatDialog } from '@angular/material/dialog';
import { ListadoDialogComponent } from '../listado-dialog/listado-dialog.component';
import { ConfirmTableDialogComponent } from '../confirm-table-dialog/confirm-table-dialog.component';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MAT_DATE_FORMATS, DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { UtilsService } from '../../services/utils/utils.service';
import { ReporteUtilsService } from '../../services/utils/reporte-utils.service';
import { StockCategoria } from '../../models/stock-categoria.model';
import { StockProducto } from '../../models/stock-producto.model';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions, ChartType } from 'chart.js';
import {
  Chart,
  DoughnutController,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

export interface StockParaOperar {
  stock: ProductosStock;
  cantidad: number;
  observaciones: string | null | undefined;
  motivoBaja?: string | null | undefined;
  ids?: number[];
  codigos?: (string | null)[];
}

export interface ProductosInformacion {
  id: number;
  id_producto_flujo: number;
  codigo: string | null;
  codigo_producto: number | null;
  codigo_general: string | null;
  codigo_antiguo: string | null;
  numero_de_serie: string | null;
  observaciones: string | null;
  empleado_custodia: number | null;
  activo: boolean;
  updated: string | null;
}

export const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMMM YYYY',
    dateA11yLabel: 'DD/MM/YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'stock-form',
  templateUrl: './stock-form.component.html',
  styleUrls: ['./stock-form.component.scss'],
  imports: [CommonModule, MaterialModule, ReactiveFormsModule, FormsModule, BaseChartDirective],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-AR' },
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS }
  ]
})
export class StockFormComponent implements OnInit, AfterViewInit {
  stockForm!: FormGroup;
  categorias: Categoria[] = [];
  productos: Producto[] = [];
  stockItems: ProductosStock[] = [];
  stockParaOperar: StockParaOperar[] = [];
  empleados: Empleado[] = [];
  displayedColumns: string[] = [];
  displayedColumnsAsignacion: string[] = [];
  dataSource = new MatTableDataSource<ProductosStock>();
  stockParaOperarDS = new MatTableDataSource<StockParaOperar>();
  dataSourceCategoria = new MatTableDataSource<StockCategoria>();
  dataSourceProducto = new MatTableDataSource<StockProducto>();
  displayedColumnsCategoria: string[] = ['categoriaNombre', 'total', 'totalDisponible', 'totalCustodia'];
  displayedColumnsProducto: string[] = ['productoNombre', 'categoriaNombre', 'total', 'totalDisponible', 'totalCustodia'];

  stockEditando: ProductosStock | null = null;
  filteredCategorias!: Observable<Categoria[]>;
  filteredProductos!: Observable<Producto[]>;
  legajoLogueado : number | null = null;
  legajoCustodia : number | null = null;
  modoCustodia = false;
  modoAsignar = false;
  modoQuitar = false;
  modoTransferir = false;
  modoListadoCategoria = false;
  modoListadoProducto = false;
  modoGraficos = false;
  empleadoControl = new FormControl();
  empleadoSeleccionado: any = null;
  empleadosFiltrados: Observable<any[]> = of([]);
  dependenciaControl = new FormControl();
  fechaDevolucionControl = new FormControl(null);
  fechaMinimaDevolucion = new Date();
  stockCategoria: StockCategoria[] = [];
  dependencias: string[] = ['PATRIMONIO','RENTAS','DESPACHO','GOBIERNO','CATASTRO','ARCHIVO','HACIENDA','CONTADURIA','RRHH','BROMATOLOGIA','INFORMATICA',
                            'PEDIDOS','RECAUDACION','OBRAS','LIQUIDACION','TESORERIA','COMPRAS'];
  filtrosCategoria = [
    { id: 'total', nombre: 'Total' },
    { id: 'disponible', nombre: 'Total Disponible' },
    { id: 'custodia', nombre: 'Total En Custodia' },
  ];

  filtroSeleccionado = 'total';

  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild('paginatorCategoria') paginatorCategoria!: MatPaginator;
  @ViewChild('paginatorProducto') paginatorProducto!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  constructor(
    private fb: FormBuilder,
    private stockService: StockService,
    private reporteUtils: ReporteUtilsService,
    private empleadoService: EmpleadoService,
    private categoriaService: CategoriaService,
    private productoService: ProductoService,
    private dialogService: DialogService,
    private dialog: MatDialog,
    private utils: UtilsService,
    @Inject('menuData') public menuData: any
  ) {}

  ngOnInit(): void {

    this.fechaMinimaDevolucion.setDate(this.fechaMinimaDevolucion.getDate() + 1);
    this.modoCustodia = this.menuData?.modoCustodia || false;
    this.legajoLogueado = this.menuData?.empleadoLogueado?.legajo || null;
    this.legajoCustodia = this.menuData?.empleado?.legajo || null;
    this.modoAsignar = this.menuData?.modoAsignar || false;
    this.modoQuitar = this.menuData?.modoQuitar || false;
    this.modoTransferir = this.menuData?.modoTransferir || false;
    this.modoListadoCategoria = this.menuData?.modoListadoCategoria || false;
    this.modoListadoProducto = this.menuData?.modoListadoProducto || false;
    this.modoGraficos = this.menuData?.modoGraficos || false;

    if (this.modoListadoCategoria || this.modoGraficos) {
      this.cargarStockPorCategoria();
    }

    if (this.modoListadoProducto || this.modoGraficos) {
      this.cargarStockPorProducto();
    }

    this.displayedColumnsAsignacion = ['categoriaNombre', 'productoNombre', 'detalle', 'cantidad', 'consumible', 'conDevolucion', 'observaciones', 'accionesAsignar'];
    this.displayedColumns = this.modoCustodia
              ? ['categoriaNombre', 'productoNombre', 'detalle', 'cantidadCustodia', 'tipo', 'marca', 'modelo', 'consumible', 'conDevolucion', 'movimientos', 'listado']
              : this.modoAsignar || this.modoQuitar || this.modoTransferir
                ? ['categoriaNombre', 'productoNombre', 'detalle', 'cantidadDisponible', 'cantidadCustodia', 'tipo', 'marca', 'modelo', 'consumible', 'conDevolucion', 'accionesAgregar']
                : ['categoriaNombre', 'productoNombre', 'detalle', 'cantidad', 'tipo', 'marca', 'modelo', 'consumible', 'conDevolucion', 'listado', 'movimientos', 'custodia', 'acciones'];

    this.stockForm = this.fb.group({
      categoria: ['', Validators.required],
      producto: [{ value: '', disabled: true }, Validators.required],
      marca: [''],
      modelo: [''],
      detalle: [''],
      tipo: ['', Validators.required],
      consumible: ['false', Validators.required],
      conDevolucion: ['false', Validators.required]
    });

    this.categoriaService.getCategorias().subscribe(data => {
      this.categorias = data;
      this.filteredCategorias = this.stockForm.controls['categoria'].valueChanges.pipe(
        startWith(''),
        map(value => this.filterList(value, this.categorias))
      );
    });

    // ✅ Listener para detectar cambios en "tipo" de stock
    this.stockForm.get('tipo')?.valueChanges.subscribe((value: string) => {
      if (value === 'Insumos') {
        this.stockForm.get('consumible')?.setValue('true', { emitEvent: true }); // este sí debe emitir
      } else if (value === 'Dotacion Fija') {
        this.stockForm.get('consumible')?.setValue('false', { emitEvent: true }); // idem
      }
    });

    this.stockForm.get('consumible')?.valueChanges.subscribe(valor => {
      const conDevCtrl = this.stockForm.get('conDevolucion');
      if (valor === 'true') {
        conDevCtrl?.setValue('false', { emitEvent: false });
        conDevCtrl?.disable({ emitEvent: false });
      } else {
        conDevCtrl?.enable({ emitEvent: false });
      }
    });

    this.stockForm.get('conDevolucion')?.valueChanges.subscribe(valor => {
      const consCtrl = this.stockForm.get('consumible');
      if (valor === 'true') {
        consCtrl?.setValue('false', { emitEvent: false });
        consCtrl?.disable({ emitEvent: false });
      } else {
        consCtrl?.enable({ emitEvent: false });
      }
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
    this.loadEmpleados();
  }

  ngAfterViewInit(): void {

    if (!this.modoListadoCategoria && !this.modoListadoProducto) {
      this.dataSource.paginator = this.paginator;
    }
    
    this.onTipoCustodiaChange();

    if (this.modoListadoCategoria) {
      this.dataSourceCategoria.paginator = this.paginatorCategoria;
    }

    if (this.modoListadoProducto) {
      this.dataSourceProducto.paginator = this.paginatorProducto;
    }
  }

  applyFilterCategoria(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSourceCategoria.filter = filterValue.trim().toLowerCase();
  }

  applyFilterProducto(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSourceProducto.filter = filterValue.trim().toLowerCase();
  }

  tieneConDevolucion(): boolean {
    return this.stockParaOperar.some(item => item.stock.conDevolucion);
  }

  tieneConsumible(): boolean {
    return this.stockParaOperar.some(item => item.stock.consumible);
  }

  abrirAutocomplete(): void {
    this.empleadoControl.setValue("");
    this.empleadoSeleccionado = null;
  }

  filtrarEmpleados(nombre: string): any[] {
    const filterValue = nombre.toLowerCase();
    return this.empleados.filter(emp =>
      `${emp.legajo} ${emp.nombre}`.toLowerCase().includes(filterValue)
    );
  }

  displayEmpleado(empleado: any): string {
    return empleado ? `${empleado.legajo} - ${empleado.nombre}` : '';
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

  onTipoCustodiaChange(): void {

    this.stockForm.get('tipoCustodia')?.valueChanges.subscribe(value => {
      const legajoCtrl = this.stockForm.get('legajoCustodia');
    
      if (value === '1') {
        legajoCtrl?.enable();
      } else {
        legajoCtrl?.disable();
        legajoCtrl?.reset();
      }
    });
  }

  onSubmit(): void {
    if (this.stockForm.invalid) return;
  
    const stock = this.buildStockFromForm();
  
    if (this.stockEditando) {
      this.actualizarStock(stock);
      return;
    }
  
    if (this.existeStockDuplicado(stock)) {
      this.mostrarDialogoOk(
        'Ya Existe Un Stock Con La Misma Categoría, Producto Y Detalle. No Se Puede Agregar Duplicado.',
        {
          icono: 'error_outline',
          colorIcono: '#d32f2f',
          titulo: '¡Advertencia!'
        }
      );
      return;
    }
  
    const similares = this.buscarStocksSimilares(stock);
    if (similares.length > 0) {
      this.confirmarAgregarStockSimilar(similares, stock);
      return;
    }
  
    this.crearNuevoStock(stock);
  }

  private buildStockFromForm(): ProductosStock {
    const categoria = this.stockForm.value.categoria as Categoria;
    const producto = this.stockForm.value.producto as Producto;
  
    return {
      id: this.stockEditando?.id,
      categoria: { id: categoria.id, nombre: categoria.nombre },
      categoriaNombre: categoria.nombre,
      producto: {
        id: producto.id,
        nombre: producto.nombre,
        categoria: { id: categoria.id, nombre: categoria.nombre },
        categoriaNombre: categoria.nombre
      },
      productoNombre: producto.nombre,
      cantidad: this.stockEditando?.cantidad || 0,
      cantidadCustodia: this.stockEditando?.cantidadCustodia || 0,
      tipo: this.stockForm.value.tipo,
      marca: this.stockForm.value.marca,
      modelo: this.stockForm.value.modelo,
      detalle: this.stockForm.value.detalle,
      consumible: this.stockForm.value.consumible === 'true',
      conDevolucion: this.stockForm.value.conDevolucion === 'true'
    };
  }

  private existeStockDuplicado(stock: ProductosStock): boolean {
    const detalleForm = stock.detalle?.trim().toLowerCase() ?? '';
    return this.stockItems.some(s =>
      s.producto.id === stock.producto.id &&
      s.categoria.id === stock.categoria.id &&
      (s.detalle?.trim().toLowerCase() ?? '') === detalleForm
    );
  }
  
  private buscarStocksSimilares(stock: ProductosStock): ProductosStock[] {
    const detalleForm = stock.detalle?.trim().toLowerCase() ?? '';
    return this.stockItems.filter(s =>
      s.producto.id === stock.producto.id &&
      s.categoria.id === stock.categoria.id &&
      (s.detalle?.trim().toLowerCase() ?? '') !== detalleForm
    );
  }

  private mostrarDialogoOk(
    mensaje: string,
    opciones?: {
      icono?: string;
      colorIcono?: string;
      titulo?: string;
      textoBotonOk?: string;
    }
  ): void {
    this.dialog.open(ConfirmDialogComponent, {
      width: '500px',
      data: {
        message: mensaje,
        okOnly: true,
        icon: opciones?.icono || 'help_outline',
        iconColor: opciones?.colorIcono || '#2196f3',
        title: opciones?.titulo,
        okLabel: opciones?.textoBotonOk || 'OK'
      }
    });
  }

  private confirmarAgregarStockSimilar(similares: ProductosStock[], stock: ProductosStock): void {
    const dialogRef = this.dialog.open(ConfirmTableDialogComponent, {
      width: '660px',
      data: {
        message: 'Ya Existen Registros Con Esta Categoría Y Producto, Pero Con Distintos Detalles. Asegúrese De Que No Está Duplicando. ¿Desea Continuar?',
        columns: ['detalle'],
        columnNames: { detalle: 'Detalles Existente' },
        rows: similares
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.crearNuevoStock(stock);
      }
    });
  }

  private crearNuevoStock(stock: ProductosStock): void {
    this.stockService.crearStock(stock).subscribe(() => {
      this.stockService.showSuccessMessage('Stock Guardado Con Éxito', 5);
      this.utils.guardarLog(this.menuData?.empleadoLogueado?.nombre, 'Stock Guardado ' + JSON.stringify(stock));
      this.cancelarEdicion();
      this.loadStock();
    });
  }
  
  private actualizarStock(stock: ProductosStock): void {
    this.stockService.actualizarStock(stock.id!, stock).subscribe(() => {
      this.stockService.showSuccessMessage('Stock Actualizado Con Éxito', 5);
      this.utils.guardarLog(this.menuData?.empleadoLogueado?.nombre, 'Stock Actualizado ' + JSON.stringify(stock));
      this.cancelarEdicion();
      this.loadStock();
    });
  }

  loadStock(): void {
    const stockObservable =
      (this.modoCustodia || this.modoQuitar) && this.legajoCustodia !== null
        ? this.stockService.getStockPorCustodia(this.legajoCustodia)
        : this.modoAsignar
          ? this.stockService.getStockDisponibleParaAsignar()
          : this.modoTransferir && this.legajoCustodia !== null
            ? this.stockService.getStockPorCustodia(this.legajoCustodia)
            : this.stockService.getStock();
  
    stockObservable.subscribe(data => {
      if((this.modoTransferir || this.modoCustodia || this.modoQuitar) && this.legajoCustodia !== null){
        data=data.filter(stock=>stock.consumible==false);
      }
      this.stockItems = data;
      this.dataSource.data = this.stockItems;
      this.updatePaginator();
      this.dataSource.sort = this.sort; // ✅ Aseguramos que se asigne después de obtener datos
    });
  }

  loadEmpleados(): void {
    this.empleadoService.getEmpleados().subscribe(data => {
      this.empleados = data.filter(empleado=>empleado.legajo!=this.menuData.empleadoLogueado.legajo);
      this.empleadosFiltrados = this.empleadoControl.valueChanges.pipe(
        startWith(''),
        map(value => typeof value === 'string' ? value : `${value.legajo} ${value.nombre}`),
        map(name => this.filtrarEmpleados(name))
      );
    });
  }

  onEmpleadoSeleccionado(event: MatAutocompleteSelectedEvent): void {
    this.empleadoSeleccionado = event.option.value;
  }

  /** ✅ Cargar datos en el formulario para edición */
  editarItem(stock: ProductosStock): void {

    this.scrollArriba();

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
      tipo: stock.tipo,
      marca: stock.marca,
      modelo: stock.modelo,
      detalle: stock.detalle,
      consumible: stock.consumible ? 'true' : 'false',
      conDevolucion: stock.conDevolucion ? 'true' : 'false'
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

  scrollArriba(): void {
    
    const content = document.querySelector('.mat-sidenav-content');
    if (content) {
      content.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
      marca: '',
      modelo: '',
      detalle: '',
      tipo: ''
    });
    this.stockForm.controls['producto'].disable();
    this.stockForm.get('legajoCustodia')?.disable();
  }

  agregar(stock: ProductosStock): void {
    const tituloAccion = this.modoAsignar
      ? 'Asignar'
      : this.modoQuitar
      ? 'Quitar'
      : this.modoTransferir
      ? 'Transferir'
      : 'Operación';
  
    const legajoText = this.modoTransferir ? '' : ` A Empleado Legajo: ${this.menuData.empleado.legajo}`;
    const dialogRef = this.dialog.open(DynamicFormDialogComponent, {
      width: '820px',
      data: {
        title: `${tituloAccion} Producto ${stock.productoNombre} ${stock.detalle ?? ''}${legajoText}`,
        fields: [
          { name: 'cantidad', label: `Cantidad a ${tituloAccion}`, type: 'number', required: true },
          { name: 'observaciones', label: 'Observaciones', type: 'text', required: false },
          { name: 'numeroDeSerie', label: 'Números de Serie', type: 'serie-selector', required: false,stockId: stock.id,
            modo: this.modoAsignar ? 'asignar' : this.modoTransferir ? 'transferir' : 'quitar', legajoEmpleado: this.menuData.empleado.legajo },
          { name: 'codigo', label: 'Codigos', type: 'serie-selector', required: false, stockId: stock.id, 
            modo: this.modoAsignar ? 'asignar' : this.modoTransferir ? 'transferir' : 'quitar', legajoEmpleado: this.menuData.empleado.legajo },
          { name: 'codigoAntiguo', label: 'Codigos Antiguos', type: 'serie-selector', required: false, stockId: stock.id,
            modo: this.modoAsignar ? 'asignar' : this.modoTransferir ? 'transferir' : 'quitar', legajoEmpleado: this.menuData.empleado.legajo }
        ]
      }
    });
  
    dialogRef.afterClosed().subscribe(result => {

      if (result) {
        const cantidadIngresada = +result.cantidad;
  
        if (cantidadIngresada <= 0) {
          this.mostrarDialogoOk('La Cantidad Debe Ser Mayor A Cero.', {
            icono: 'error_outline',
            colorIcono: '#d32f2f',
            titulo: 'Cantidad inválida'
          });
          return;
        }
  
        let disponible = 0;
  
        if (this.modoAsignar) {
          disponible = stock.consumible
            ? stock.cantidad
            : stock.cantidad - stock.cantidadCustodia;
  
          if (cantidadIngresada > disponible) {
            this.mostrarDialogoOk(
              stock.consumible ?
              `La Cantidad Ingresada Supera El Disponible Sin Asignar Igual A ${disponible}.` :
              `La Cantidad Ingresada Supera El Disponible Sin Custodia Igual A ${disponible}.`,
              {
                icono: 'error_outline',
                colorIcono: '#d32f2f',
                titulo: 'Cantidad excedida'
              }
            );
            return;
          }
        }
  
        if (this.modoQuitar || this.modoTransferir) {
          const enCustodia = stock.cantidadCustodiaLegajo ?? 0;
  
          if (cantidadIngresada > enCustodia) {
            this.mostrarDialogoOk(
              `La Cantidad Ingresada Supera La Cantidad En Custodia (${enCustodia}).`,
              {
                icono: 'error_outline',
                colorIcono: '#d32f2f',
                titulo: 'Cantidad excedida'
              }
            );
            return;
          }
        }

        const idsSeleccionados = [
          ...(result.numeroDeSerie ?? []),
          ...(result.codigo ?? []),
          ...(result.codigoAntiguo ?? [])
        ]
          .map((item: any) => Number(item.value ?? item.id))
          .filter((v: any) => !isNaN(v));

        // ✅ Quitar duplicados
        const idsUnicos = Array.from(new Set(idsSeleccionados));
  
        const stockAsignado: StockParaOperar = {
          stock: stock,
          cantidad: cantidadIngresada,
          observaciones: result.observaciones?.trim() || null,
          ids: idsUnicos ?? [],
          codigos: Array.isArray(result.codigo)
            ? result.codigo.map((c: { label: any; }) => c.label)
            : []
        };
  
        this.stockParaOperar.push(stockAsignado);
        this.stockParaOperarDS.data = [...this.stockParaOperar]; // ✅ Forzar actualización
      }
    });
  }

  confirmarAsignacion(): void {
    const legajoCustodia = this.menuData?.empleado?.legajo;
    const nombre = this.menuData?.empleado?.nombre;
  
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        message: `¿Está Seguro Que Desea Asignar El Stock Seleccionado Al Empleado ${legajoCustodia} ${nombre}?`
      }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.asignarStockYGenerarReporte();
      }
    });
  }

  async asignarStockYGenerarReporte(): Promise<void> {
    const legajoCustodia = this.menuData?.empleado?.legajo;
    const legajoCarga = this.menuData?.empleadoLogueado?.legajo;
    const nombre = this.menuData?.empleado?.nombre;
    const fechaDevolucion = this.fechaDevolucionControl.value || null;
  
    const items = this.stockParaOperar.map(stock => ({
      stockId: stock.stock.id!,
      cantidad: stock.cantidad,
      observaciones: stock.observaciones ?? undefined,
      fechaDevolucion: fechaDevolucion
    }));

    for (const item of this.stockParaOperar) {
      const seleccionados = item.ids ?? [];
      const faltan = item.cantidad - seleccionados.length;

      if (faltan > 0) {
        try {
          // Espera la respuesta ANTES de seguir
          const respuesta = await lastValueFrom(
            this.stockService.getCodigosLibres(
              item.stock.id!,
              faltan,
              item.ids ?? []
            )
          );

          const nuevosIds = respuesta.map(r => r.id);
          const nuevosCodigos = respuesta.map(r => r.codigo);

          item.ids = [...(item.ids ?? []), ...nuevosIds];
          item.codigos = [...(item.codigos ?? []), ...nuevosCodigos];

        } catch (err) {
          console.error("Error obteniendo códigos libres", err);
        }
      }
    }

    // Recalcular ids únicos
    const idsSeleccionados = this.stockParaOperar.flatMap(s => s.ids ?? []);
    const idsUnicos = Array.from(new Set(idsSeleccionados));

    if (idsUnicos.length > 0) {
      try {
        await lastValueFrom(
          this.stockService.asignarCustodiaProductos(idsUnicos, legajoCustodia)
        );

        this.stockService.showSuccessMessage('IDs Asignados Correctamente', 5);
        this.utils.guardarLog(
          this.menuData?.empleadoLogueado?.nombre,
          'IDs Asignados ' + JSON.stringify(idsUnicos) + ' ' + legajoCustodia
        );

      } catch (error) {
        console.error('Error al asignar IDs:', error);
        this.stockService.showErrorMessage('Error al asignar los IDs', 5);
        return; // ← IMPORTANTE: detener ejecución si falla
      }
    }

    //OBTENER TODOS LOS IDS INCLUIDOS LOS FALTANTES Y LOS CODIGOS
    if (items.length && legajoCustodia) {
      this.stockService.asignarCustodia(items, legajoCustodia, legajoCarga).subscribe(() => {
        this.stockService.showSuccessMessage('Stock Asignado Con Éxito', 5);
        this.utils.guardarLog(this.menuData?.empleadoLogueado?.nombre, 'Stock Asignado ' + JSON.stringify(items) + ' ' + legajoCustodia + ' ' + legajoCarga);
  
        // Separar consumibles y no consumibles
        const consumibles = this.stockParaOperar.filter(i => i.stock.consumible);
        const noConsumibles = this.stockParaOperar.filter(i => !i.stock.consumible);

        // Dividir los no consumibles con y sin devolución
        const conFecha = noConsumibles.filter(i => i.stock.conDevolucion);
        const sinFecha = noConsumibles.filter(i => !i.stock.conDevolucion);
  
        // Generar reporte de consumibles
        if (consumibles.length) {
          this.reporteUtils.generarReporteAsignacion(consumibles, 'acta-entrega-patrimonial', {
            generaReporteLegajo: legajoCarga,
            generaReporteNombre: this.menuData?.empleadoLogueado?.nombre,
            legajoEmpleado: legajoCustodia,
            nombreEmpleado: nombre,
            legajoEmpleadoEntrega: legajoCarga,
            nombreEmpleadoEntrega: this.menuData?.empleadoLogueado?.nombre,
            legajoEmpleadoRecibe: legajoCarga,
            nombreEmpleadoRecibe: this.menuData?.empleadoLogueado?.nombre,
            dependenciaAutoriza: this.dependenciaControl.value
          });
        }

        // Generar reporte de no consumibles sin devolución
        if (sinFecha.length) {
          this.reporteUtils.generarReporteAsignacion(sinFecha, 'acta-alta-patrimonial', {
            generaReporteLegajo: legajoCarga,
            generaReporteNombre: this.menuData?.empleadoLogueado?.nombre,
            legajoEmpleado: legajoCustodia,
            nombreEmpleado: nombre,
            legajoEmpleadoEntrega: legajoCarga,
            nombreEmpleadoEntrega: this.menuData?.empleadoLogueado?.nombre,
            legajoEmpleadoRecibe: legajoCarga,
            nombreEmpleadoRecibe: this.menuData?.empleadoLogueado?.nombre,
            dependenciaAutoriza: this.dependenciaControl.value
          });
        }

        // Generar reporte de no consumibles con devolución
        if (conFecha.length) {
          this.reporteUtils.generarReporteAsignacion(conFecha, 'acta-alta-patrimonial-confecha', {
            generaReporteLegajo: legajoCarga,
            generaReporteNombre: this.menuData?.empleadoLogueado?.nombre,
            legajoEmpleado: legajoCustodia,
            nombreEmpleado: nombre,
            legajoEmpleadoEntrega: legajoCarga,
            nombreEmpleadoEntrega: this.menuData?.empleadoLogueado?.nombre,
            legajoEmpleadoRecibe: legajoCarga,
            nombreEmpleadoRecibe: this.menuData?.empleadoLogueado?.nombre,
            dependenciaAutoriza: this.dependenciaControl.value,
            fechaDevolucion: fechaDevolucion
          });
        }
  
        // Limpiar selección y recargar stock
        this.stockParaOperar = [];
        this.stockParaOperarDS.data = [];
        this.dependenciaControl.setValue(null);
        this.loadStock();
      });
    }
  }

  get mostrarCustodiaLegajo(): boolean {
    return this.dataSource?.data?.some(s => s.cantidadCustodiaLegajo != null && s.cantidadCustodiaLegajo !== undefined);
  }

  confirmarQuitarCustodia(): void {
    const legajoCustodia = this.menuData?.empleado?.legajo;
    const nombre = this.menuData?.empleado?.nombre;
  
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        message: `¿Está Seguro Que Desea Quitar De Custodia El Stock Seleccionado Al Empleado ${legajoCustodia} ${nombre}?`
      }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.quitarCustodiaYGenerarReporte();
      }
    });
  }

  async quitarCustodiaYGenerarReporte(): Promise<void> {

    const legajoCustodia = this.menuData?.empleado?.legajo;
    const legajoCarga = this.menuData?.empleadoLogueado?.legajo;
    const nombre = this.menuData?.empleado?.nombre;
  
    const items = this.stockParaOperar.map(stock => ({
      stockId: stock.stock.id!,
      cantidad: stock.cantidad,
      observaciones: stock.observaciones ?? undefined
    }));

    for (const item of this.stockParaOperar) {
      const seleccionados = item.ids ?? [];
      const faltan = item.cantidad - seleccionados.length;

      if (faltan > 0) {
        try {
          // Espera la respuesta ANTES de seguir
          const respuesta = await lastValueFrom(
            this.stockService.getCodigosEnCustodia(
              item.stock.id!,
              faltan,
              legajoCustodia,
              item.ids ?? []
            )
          );

          const nuevosIds = respuesta.map(r => r.id);
          const nuevosCodigos = respuesta.map(r => r.codigo);

          item.ids = [...(item.ids ?? []), ...nuevosIds];
          item.codigos = [...(item.codigos ?? []), ...nuevosCodigos];

        } catch (err) {
          console.error("Error obteniendo códigos libres", err);
        }
      }
    }

    // Recalcular ids únicos
    const idsSeleccionados = this.stockParaOperar.flatMap(s => s.ids ?? []);
    const idsUnicos = Array.from(new Set(idsSeleccionados));

    if (idsUnicos.length > 0) {
      console.log('IDs que se van a quitar de custodia:', idsUnicos);
      try {
        await lastValueFrom(
          this.stockService.asignarCustodiaProductos(idsUnicos)
        );

        this.stockService.showSuccessMessage('IDs Quitados De Custodia Correctamente', 5);
        this.utils.guardarLog(
          this.menuData?.empleadoLogueado?.nombre,
          'IDs Quitados De Custodia ' + JSON.stringify(idsUnicos)
        );

      } catch (error) {
        console.error('Error al quitar IDs de custodia:', error);
        this.stockService.showErrorMessage('Error Al Quitar De Custodia Los IDs', 5);
        return; // ← IMPORTANTE: detener ejecución si falla
      }
    }

    if (items.length && legajoCustodia) {
      this.stockService.quitarCustodia(items, legajoCustodia, legajoCarga).subscribe(() => {
        this.stockService.showSuccessMessage('Stock Quitado Con Éxito', 5);
        this.utils.guardarLog(this.menuData?.empleadoLogueado?.nombre, 'Stock Quitado ' + JSON.stringify(items) + ' ' + legajoCustodia + ' ' + legajoCarga);
  
        // Generar reporte de baja
        this.reporteUtils.generarReporteAsignacion(this.stockParaOperar, 'acta-devolucion-patrimonial', {
          generaReporteLegajo: legajoCarga,
          generaReporteNombre: this.menuData?.empleadoLogueado?.nombre,
          legajoEmpleado: legajoCustodia,
          nombreEmpleado: nombre,
          legajoEmpleadoEntrega: legajoCarga,
          nombreEmpleadoEntrega: this.menuData?.empleadoLogueado?.nombre,
          legajoEmpleadoRecibe: legajoCarga,
          nombreEmpleadoRecibe: this.menuData?.empleadoLogueado?.nombre,
          dependenciaAutoriza: this.dependenciaControl.value
        });
  
        // Limpiar selección y recargar stock
        this.stockParaOperar = [];
        this.stockParaOperarDS.data = [];
        this.dependenciaControl.setValue(null);
        this.loadStock();
      });
    }
  }

  confirmarTransferencia(): void {

    const legajoDestino = this.empleadoSeleccionado.legajo;
    const nombre = this.empleadoSeleccionado.nombre;
  
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        message: `¿Está Seguro Que Desea Transferir El Stock Seleccionado Al Empleado ${legajoDestino} ${nombre}?`
      }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.transferirCustodiaYGenerarReporte();
      }
    });
  }

  async transferirCustodiaYGenerarReporte(): Promise<void> {

    const legajoDestino = this.empleadoSeleccionado.legajo;
    const legajoOrigen = this.menuData?.empleado?.legajo;
    const legajoCarga = this.menuData?.empleadoLogueado?.legajo;
    const items = this.stockParaOperar.map(stock => ({
      stockId: stock.stock.id!,
      cantidad: stock.cantidad,
      observaciones: stock.observaciones ?? undefined
    }));

    for (const item of this.stockParaOperar) {
      const seleccionados = item.ids ?? [];
      const faltan = item.cantidad - seleccionados.length;

      if (faltan > 0) {
        try {
          // Espera la respuesta ANTES de seguir
          const respuesta = await lastValueFrom(
            this.stockService.getCodigosEnCustodia(
              item.stock.id!,
              faltan,
              legajoOrigen,
              item.ids ?? []
            )
          );

          const nuevosIds = respuesta.map(r => r.id);
          const nuevosCodigos = respuesta.map(r => r.codigo);

          item.ids = [...(item.ids ?? []), ...nuevosIds];
          item.codigos = [...(item.codigos ?? []), ...nuevosCodigos];

        } catch (err) {
          console.error("Error obteniendo códigos libres", err);
        }
      }
    }

    // Recalcular ids únicos
    const idsSeleccionados = this.stockParaOperar.flatMap(s => s.ids ?? []);
    const idsUnicos = Array.from(new Set(idsSeleccionados));

    if (idsUnicos.length > 0) {
      try {
        await lastValueFrom(
          this.stockService.asignarCustodiaProductos(idsUnicos, legajoDestino)
        );

        this.stockService.showSuccessMessage('IDs Transferidos Correctamente', 5);
        this.utils.guardarLog(
          this.menuData?.empleadoLogueado?.nombre,
          'IDs Transferidos ' + JSON.stringify(idsUnicos) + ' ' + legajoDestino
        );

      } catch (error) {
        console.error('Error al transferir IDs:', error);
        this.stockService.showErrorMessage('Error al transferir los IDs', 5);
        return; // ← IMPORTANTE: detener ejecución si falla
      }
    }

    if (items.length && legajoOrigen && legajoDestino) {
      this.stockService.transferirCustodia(items, legajoOrigen, legajoDestino, legajoCarga).subscribe(() => {
        this.stockService.showSuccessMessage('Stock Transferido Con Éxito', 5);
        this.utils.guardarLog(this.menuData?.empleadoLogueado?.nombre, 'Stock Transferido ' + JSON.stringify(items) + ' ' + legajoOrigen + ' ' + legajoDestino);
  
        // Generar reporte de transferencia
        this.reporteUtils.generarReporteAsignacion(this.stockParaOperar, 'acta-transferencia-patrimonial', {
          generaReporteLegajo: legajoCarga,
          generaReporteNombre: this.menuData?.empleadoLogueado?.nombre,
          legajoEmpleado: legajoOrigen,
          nombreEmpleado: this.menuData?.empleado?.nombre,
          legajoEmpleadoEntrega: legajoOrigen,
          nombreEmpleadoEntrega: this.menuData?.empleado?.nombre,
          legajoEmpleadoRecibe: legajoDestino,
          nombreEmpleadoRecibe: this.empleadoSeleccionado?.nombre,
          dependenciaAutoriza: this.dependenciaControl.value
        });
  
        // Limpiar selección y recargar stock
        this.stockParaOperar = [];
        this.stockParaOperarDS.data = [];
        this.dependenciaControl.setValue(null);
        this.loadStock();
      });
    }
  }
  
  eliminar(stock: StockParaOperar): void {
    this.stockParaOperar = this.stockParaOperar.filter(s => s.stock.id !== stock.stock.id);
    this.stockParaOperarDS.data = [...this.stockParaOperar];
  }
  
  cancelar(): void {
    this.stockParaOperar = [];
    this.stockParaOperarDS.data = [];
  }

  /** ✅ Eliminar un stock */
  eliminarStock(id: number): void {
    this.dialogService.confirm('¿Seguro Que Quieres Eliminar Este Stock?').subscribe(result => {
      if (result) {
        this.stockService.eliminarStock(id).subscribe(() => {
          this.stockService.showSuccessMessage('Stock Eliminado Con Éxito', 5);
          this.utils.guardarLog(this.menuData?.empleadoLogueado?.nombre, 'Stock Eliminado ' + id);
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

  abrirModalAgregarStock(stock: ProductosStock): void {
    const dialogRef = this.dialog.open(DynamicFormDialogComponent, {
      width: '820px',
      data: {
        title: `Agregar Stock a: ${stock.productoNombre} ${stock.detalle} ${stock.marca ?? ''}`,
        fields: [
          { name: 'cantidad', label: 'Cantidad', type: 'number', required: true },
          { name: 'remito', label: 'Remito', type: 'text', required: false },
          { name: 'observaciones', label: 'Observaciones', type: 'text', required: false },
          { name: 'numeroDeSerie', label: 'Números de Serie', type: 'text', required: false, multiple: true },
          { name: 'codigoAntiguo', label: 'Codigos Antiguos', type: 'text', required: false, multiple: true }
        ]
      }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const cantidadAdicional = +result.cantidad;
        const empleado = this.menuData?.empleadoLogueado;
        const legajo = empleado?.legajo;
        const total = stock.cantidad + cantidadAdicional;
  
        // 1. Actualizar cantidad total
        const stockActualizado: ProductosStock = {
          ...stock,
          cantidad: total
        };
  
        this.stockService.actualizarStock(stock.id!, stockActualizado).subscribe(() => {
  
          // 2. Registrar flujo de stock
          const flujo = {
            productoStock: { id: stock.id },
            cantidad: cantidadAdicional,
            total: total,
            totalLegajoCustodia: 0,
            tipo: 'alta',
            empleadoCarga: legajo,
            remito: result.remito?.trim() || null,
            observaciones: result.observaciones?.trim() || null
          };
  
          this.stockService.crearFlujoDeStock(flujo).subscribe(flujoCreado => {
            const cantidad = +result.cantidad;
            const numerosDeSerie = (result.numeroDeSerie instanceof Array)
              ? result.numeroDeSerie.filter((n: string) => n && n.trim() !== '')
              : [];

            const codigosAntiguos = (result.codigoAntiguo instanceof Array)
              ? result.codigoAntiguo.filter((n: string) => n && n.trim() !== '')
              : [];

            const registros = Array.from({ length: cantidad }, (_, index) => ({
              productoFlujo: { id: flujoCreado.id },
              numeroDeSerie: index < numerosDeSerie.length ? numerosDeSerie[index].trim() : null,
              codigoAntiguo: index < codigosAntiguos.length ? codigosAntiguos[index].trim() : null,
              empleadoCustodia: null
            }));

            this.stockService.crearInformacionProductos(registros).subscribe(() => {
              const mensaje = numerosDeSerie.length
                ? `Stock Agregado (${cantidad} unidades, ${numerosDeSerie.length} con N° de Serie)`
                : `Stock Agregado (${cantidad} unidades sin N° de Serie)`;

              this.stockService.showSuccessMessage(mensaje, 5);
              this.utils.guardarLog(
                this.menuData?.empleadoLogueado?.nombre,
                `${mensaje} ${JSON.stringify(flujo)} ${JSON.stringify(numerosDeSerie)} ${JSON.stringify(codigosAntiguos)}`
              );
              this.loadStock();
            },
            (err) => {
              console.error('Error al crear información del producto:', err);
              const mensajeError =
                err?.error?.message ||
                err?.error ||
                err ||
                'Ocurrió un error al agregar el stock.';

              this.stockService.showErrorMessage(mensajeError, 6);
            });
          });
        });
      }
    });
  }

  async abrirModalBajaStock(stock: ProductosStock): Promise<void> {

    const dialogRef = this.dialog.open(DynamicFormDialogComponent, {
      width: '820px',
      data: {
        title: `Dar De Baja Stock: ${stock.productoNombre} ${stock.detalle} ${stock.marca ?? ''}`,
        fields: [
          { name: 'cantidad', label: 'Cantidad a Dar de Baja', type: 'number', required: true },
          { name: 'motivoBaja', label: 'Motivo De Baja', type: 'text', required: true },
          { name: 'observaciones', label: 'Observaciones', type: 'text', required: false },
          { name: 'numeroDeSerie', label: 'Números de Serie', type: 'serie-selector', required: false, stockId: stock.id, modo: 'asignar' },
          { name: 'codigo', label: 'Codigos', type: 'serie-selector', required: false, stockId: stock.id, modo: 'asignar' },
          { name: 'codigoAntiguo', label: 'Codigos Antiguos', type: 'serie-selector', required: false, stockId: stock.id, modo: 'asignar' }
        ]
      }
    });

    dialogRef.afterClosed().subscribe(async result => {

      if (result) {
        const cantidadBaja = +result.cantidad;

        if (cantidadBaja <= 0) {
          this.mostrarDialogoOk('La Cantidad Debe Ser Mayor A Cero.', {
            icono: 'error_outline',
            colorIcono: '#d32f2f',
            titulo: '¡Cantidad Inválida!'
          });
          return;
        }

        const nuevoTotal = stock.cantidad - cantidadBaja;

        if (nuevoTotal < 0) {
          this.mostrarDialogoOk('La Cantidad A Dar De Baja Supera El Stock Actual.', {
            icono: 'error_outline',
            colorIcono: '#d32f2f',
            titulo: '¡Stock Insuficiente!'
          });
          return;
        }

        // --- Reemplazar desde aquí ---
        const seriesSeleccionadas: number[] = Array.isArray(result.numeroDeSerie)
          ? result.numeroDeSerie.map((n: any) => Number(n.value))
          : [];

        const codigosSeleccionados: number[] = Array.isArray(result.codigo)
          ? result.codigo.map((n: any) => Number(n.value))
          : [];

        const codigosSeleccionadosLabel: (string | null)[] = Array.isArray(result.codigo)
          ? result.codigo.map((n: any) => String(n.label))
          : [];

        const codigosAntiguosSeleccionados: number[] = Array.isArray(result.codigoAntiguo)
          ? result.codigoAntiguo.map((n: any) => Number(n.value))
          : [];

        // Unir y quedarnos sólo con los ids únicos (si el mismo registro fue seleccionado por serie y por código antiguo)
        const uniqueIdsSet = new Set<number>([
          ...seriesSeleccionadas,
          ...codigosSeleccionados,
          ...codigosAntiguosSeleccionados
        ]);

        let uniqueSelectedIds = Array.from(uniqueIdsSet);
        let uniqueSelectedCodes = Array.from(codigosSeleccionadosLabel);
        const legajoCarga = this.menuData?.empleadoLogueado?.legajo;
        const nombre = this.menuData?.empleado?.nombre;

        // VALIDACIÓN: la cantidad de ítems únicos seleccionados no puede superar la cantidad a dar de baja
        if (uniqueSelectedIds.length > cantidadBaja) {
          this.mostrarDialogoOk('La Cantidad De Ítems Seleccionados Supera La Cantidad A Dar De Baja.', {
            icono: 'error_outline',
            colorIcono: '#d32f2f',
            titulo: '¡Error De Validación!'
          });
          return;
        }

        const faltan = cantidadBaja - uniqueSelectedIds.length;

        if (faltan > 0) {
          try {
            const respuesta = await lastValueFrom(
              this.stockService.getCodigosActivos(
                stock.id!,
                faltan,
                uniqueSelectedIds
              )
            );

            const nuevosIds = respuesta.map(r => r.id);
            const nuevosCodigos = respuesta.map(r => r.codigo);

            uniqueSelectedIds = [...uniqueSelectedIds, ...nuevosIds];
            uniqueSelectedCodes = [...uniqueSelectedCodes, ...nuevosCodigos];

          } catch (err) {
            console.error("Error obteniendo códigos libres", err);
            return;
          }
        }

        const stockActualizado: ProductosStock = {
          ...stock,
          cantidad: nuevoTotal
        };

        this.stockService.actualizarStock(stock.id!, stockActualizado).subscribe(() => {
          const flujo = {
            productoStock: { id: stock.id },
            cantidad: cantidadBaja,
            total: nuevoTotal,
            totalLegajoCustodia: 0,
            tipo: 'baja',
            empleadoCarga: legajoCarga,
            motivoBaja: result.motivoBaja?.trim(),
            observaciones: result.observaciones?.trim() || null
          };

          this.stockService.crearFlujoDeStock(flujo).subscribe(() => {

            if (uniqueSelectedIds.length > 0) {
              this.stockService.darDeBajaProductos(uniqueSelectedIds).subscribe(() => {
                this.stockService.showSuccessMessage('Baja de stock y números de serie realizada correctamente', 5);
                this.utils.guardarLog(
                  this.menuData?.empleadoLogueado?.nombre,
                  'Baja De Stock y Números/Códigos Dados De Baja ' + JSON.stringify(flujo) + ' ' + JSON.stringify(uniqueSelectedIds)
                );
                this.loadStock();
              });
            } else {
              this.stockService.showSuccessMessage('Baja De Stock Registrada Con Éxito', 5);
              this.utils.guardarLog(this.menuData?.empleadoLogueado?.nombre, 'Baja De Stock Registrada ' + JSON.stringify(flujo));
              this.loadStock();
            }
          });
        });

        const stockParaOperar: StockParaOperar[] = [{
          stock: stock,
          cantidad: cantidadBaja,
          observaciones: result.observaciones?.trim() || null,
          motivoBaja: result.motivoBaja?.trim() || null,
          codigos: uniqueSelectedCodes
        }];

        // Generar reporte de baja patrimonial
        if (stockParaOperar.length) {
          this.reporteUtils.generarReporteAsignacion(stockParaOperar, 'acta-baja-patrimonial', {
            generaReporteLegajo: legajoCarga,
            generaReporteNombre: this.menuData?.empleadoLogueado?.nombre,
            legajoEmpleado: legajoCarga,
            nombreEmpleado: nombre,
            legajoEmpleadoEntrega: legajoCarga,
            nombreEmpleadoEntrega: this.menuData?.empleadoLogueado?.nombre,
            legajoEmpleadoRecibe: legajoCarga,
            nombreEmpleadoRecibe: this.menuData?.empleadoLogueado?.nombre,
            dependenciaAutoriza: this.dependenciaControl?.value
          });
        }
      }
    });
  }

  verMovimientos(stock: ProductosStock): void {

    const legajoCustodia = this.legajoCustodia ?? undefined;
    this.stockService.getAltasYBajasPorStock(stock.id!, legajoCustodia).subscribe(flujos => {
      // Formatear datos antes de mostrar
      const rows = flujos.map(flujo => ({
        ...flujo,
        tipo: flujo.tipo === 'custodia_alta' && stock.consumible
                                ? 'Entrega Alta' : flujo.tipo === 'custodia_alta' && !stock.consumible ? 'Custodia Alta'
                                : flujo.tipo === 'custodia_baja' && stock.consumible
                                  ? 'Entrega Baja' : flujo.tipo === 'custodia_baja' && !stock.consumible ? 'Custodia Baja'
                                  : flujo.tipo.charAt(0).toUpperCase() + flujo.tipo.slice(1).toLowerCase(),
        cantidad: flujo.tipo === 'baja' ? `-${flujo.cantidad}` : flujo.cantidad,
        remito: flujo.remito ? flujo.remito : '-',
        totalLegajoCustodia: flujo.tipo === 'baja' || flujo.tipo === 'alta' ? '-' : flujo.totalLegajoCustodia,
        observaciones : flujo.observaciones ? flujo.observaciones : '-'
      }));

      const base = `Flujo de Stock ${legajoCustodia ? 'en Custodia' : ''} de ${stock.productoNombre} ${stock.detalle} ${stock.marca ?? ''}`;
      const title = legajoCustodia ? `${base} en Empleado Legajo: ${legajoCustodia}` : base;
  
      this.dialog.open(ListadoDialogComponent, {
        width: '1300px',
        autoFocus: false,
        restoreFocus: false,
        data: {
          title: title,
          columns: ['tipo', 'remito','total', 'cantidad', 'fecha', 'empleadoCustodia', 'totalLegajoCustodia', 'empleadoCarga', 'observaciones'],
          columnNames: {
            tipo: 'Tipo',
            remito: 'Remito',
            total: 'Total',
            cantidad: 'Cantidad',
            fecha: 'Fecha',
            empleadoCustodia: 'Empleado Custodia',
            totalLegajoCustodia: 'Total En Custodia Legajo',
            empleadoCarga: 'Legajo Carga',
            observaciones: 'Observaciones'
          },
          rows: rows,
          filterableColumns: ['all']
        }
      });
    });
  }
  
  verListado(stock: ProductosStock, options?: { activo?: boolean, empleadoCustodia?: number }): void {
    this.stockService.getInformacionProductoEnStock(stock.id!, options).subscribe(numeros => {

      const rows = numeros.map(numero => ({
        codigo: numero.codigo ? numero.codigo : '-',
        codigoAntiguo: numero.codigoAntiguo ? numero.codigoAntiguo : '-',
        numeroDeSerie : numero.numeroDeSerie ? numero.numeroDeSerie : '-',
        empleadoCustodia: {
          legajo: numero.empleadoCustodia?.legajo || '-'
        }
      }));

      this.dialog.open(ListadoDialogComponent, {
        width: '1300px',
        autoFocus: false,
        restoreFocus: false,
        data: {
          title: `Listado De Stock De ${stock.productoNombre} ${stock.detalle} ${stock.marca ?? ''}`,
          columns: ['codigo', 'codigoAntiguo', 'numeroDeSerie', 'empleadoCustodia.legajo'],
          columnNames: {
            codigo: 'Codigo',
            codigoAntiguo: 'Codigo Antiguo',
            numeroDeSerie: 'Número de Serie',
            'empleadoCustodia.legajo': 'Custodia Legajo'
          },
          rows: rows
        }
      });
    });
  }

  verCustodias(stock: ProductosStock): void {
    this.stockService.getCustodiasActivasPorStock(stock.id!).subscribe(custodias => {
      this.dialog.open(ListadoDialogComponent, {
        width: '1300px',
        autoFocus: false,
        restoreFocus: false,
        data: {
          title: `Custodias Activas de ${stock.productoNombre} ${stock.detalle} ${stock.marca ?? ''}`,
          columns: ['empleadoCustodia', 'totalLegajoCustodia'],
          columnNames: {
            empleadoCustodia: 'Legajo Custodia',
            totalLegajoCustodia: stock.consumible ? 'Total Asignado' : 'Total Custodia'
          },
          rows: custodias
        }
      });
    });
  }

  cargarStockPorCategoria(): void {
    this.stockService.getStockPorCategoria().subscribe({
      next: (data: StockCategoria[]) => {
        this.stockCategoria = data;
        this.dataSourceCategoria.data = data;
        this.dataSourceCategoria.sort = this.sort;
        this.cargarGraficoCategoria(data);
      },
      error: () => {
        this.stockService.showErrorMessage('No se pudo cargar el stock por categoría.', 5);
      }
    });
  }

  cargarStockPorProducto(): void {
    this.stockService.getStockPorProducto().subscribe({
      next: data => {
        this.dataSourceProducto.data = data;
        this.dataSourceProducto.sort = this.sort;
      },
      error: () => this.stockService.showErrorMessage('No se pudo cargar el stock por producto.', 5)
    });
  }

  // === PALETA PREMIUM ===
  premiumColors: string[] = [
    '#3E82F7', '#5CC9A7', '#FFD166', '#EF476F',
    '#8E7CC3', '#06D6A0', '#118AB2', '#F29E4C', '#6C6CE5'
  ];

  // Tipo de gráfico (literal correcto para ng2-charts 8)
  pieChartType: 'doughnut' = 'doughnut';

  // === DATA (tipado correcto sin never[]) ===
  pieChartData: ChartData<'doughnut', number[], string> = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [],
        borderColor: '#fff',
        borderWidth: 2,
        hoverOffset: 12
      }
    ]
  };

  // === OPCIONES ===
  pieChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,  
    cutout: '0%',                
    layout: { padding: 0 },
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#444',
          font: { size: 15, family: 'Inter, Roboto, Arial' }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(30,30,30,0.9)',
        titleFont: { size: 14 },
        bodyFont: { size: 13 }
      }
    }
  };

  cargarGraficoCategoria(data: StockCategoria[]) {
    this.aplicarFiltroCategoria(data);
  }

  aplicarFiltroCategoria(data: StockCategoria[]) {
    let valores: number[] = [];

    switch (this.filtroSeleccionado) {
      case 'total':
        valores = data.map(x => Number(x.total ?? 0));
        break;

      case 'disponible':
        valores = data.map(x => Number(x.totalDisponible ?? 0));
        break;
        
      case 'custodia':
        valores = data.map(x => Number(x.totalCustodia ?? 0));
        break;
    }

    // Labels no cambian
    this.pieChartData.labels = data.map(x => x.categoriaNombre);

    // Actualizo dataset
    this.pieChartData.datasets[0].data = valores;
    this.pieChartData.datasets[0].backgroundColor =
      this.premiumColors.slice(0, valores.length);

    setTimeout(() => {
          this.chart?.update();
    }, 0);
  }
}