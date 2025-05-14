import { Component, OnInit, ViewChild, AfterViewInit, Inject } from '@angular/core';
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
import { Observable, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { MatSort } from '@angular/material/sort';
import { DialogService } from '../../services/dialog/dialog.service';
import { EmpleadoService } from '../../services/rest/empleado/empleado.service';
import { Empleado } from '../../models/empleado.model';
import { MatDialog } from '@angular/material/dialog';
import { ListadoDialogComponent } from '../listado-dialog/listado-dialog.component';
import { ConfirmTableDialogComponent } from '../confirm-table-dialog/confirm-table-dialog.component';
import { MatAutocompleteSelectedEvent, MatAutocompleteTrigger } from '@angular/material/autocomplete';

interface StockParaOperar {
  stock: ProductosStock;
  cantidad: number;
  observaciones: string | null;
  numerosDeSerie?: [];
}

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
  stockParaOperar: StockParaOperar[] = [];
  empleados: Empleado[] = [];
  displayedColumns: string[] = [];
  displayedColumnsAsignacion: string[] = [];
  dataSource = new MatTableDataSource<ProductosStock>();
  stockParaOperarDS = new MatTableDataSource<StockParaOperar>();

  stockEditando: ProductosStock | null = null;
  filteredCategorias!: Observable<Categoria[]>;
  filteredProductos!: Observable<Producto[]>;
  legajoLogueado : number | null = null;
  legajoCustodia : number | null = null;
  modoCustodia = false;
  modoAsignar = false;
  modoQuitar = false;
  modoTransferir = false;
  empleadoControl = new FormControl();
  empleadoSeleccionado: any = null;
  empleadosFiltrados: Observable<any[]> = of([]);
  dependenciaControl = new FormControl();
  dependencias: string[] = ['PATRIMONIO','RENTAS','DESPACHO','GOBIERNO','CATASTRO','ARCHIVO','HACIENDA','CONTADURIA','RRHH','BROMATOLOGIA','INFORMATICA',
                            'PEDIDOS','RECAUDACION','OBRAS','LIQUIDACION','TESORERIA','COMPRAS'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private fb: FormBuilder,
    private stockService: StockService,
    private empleadoService: EmpleadoService,
    private categoriaService: CategoriaService,
    private productoService: ProductoService,
    private dialogService: DialogService,
    private dialog: MatDialog,
    @Inject('menuData') public menuData: any
  ) {}

  ngOnInit(): void {

    this.modoCustodia = this.menuData?.modoCustodia || false;
    this.legajoLogueado = this.menuData?.empleadoLogueado?.legajo || null;
    this.legajoCustodia = this.menuData?.empleado?.legajo || null;
    this.modoAsignar = this.menuData?.modoAsignar || false;
    this.modoQuitar = this.menuData?.modoQuitar || false;
    this.modoTransferir = this.menuData?.modoTransferir || false;

    this.displayedColumnsAsignacion = ['categoriaNombre', 'productoNombre', 'detalle', 'cantidad', 'consumible', 'observaciones', 'accionesAsignar'];
    this.displayedColumns = this.modoCustodia
              ? ['categoriaNombre', 'productoNombre', 'detalle', 'cantidadCustodia', 'tipo', 'marca', 'modelo', 'consumible', 'detalles', 'numeroDeSerie']
              : this.modoAsignar || this.modoQuitar || this.modoTransferir
                ? ['categoriaNombre', 'productoNombre', 'detalle', 'cantidad', 'cantidadCustodia', 'tipo', 'marca', 'modelo', 'consumible', 'accionesAgregar']
                : ['categoriaNombre', 'productoNombre', 'detalle', 'cantidad', 'tipo', 'marca', 'modelo', 'consumible', 'numeroDeSerie', 'detalles', 'custodia', 'acciones'];

    this.stockForm = this.fb.group({
      categoria: ['', Validators.required],
      producto: [{ value: '', disabled: true }, Validators.required],
      marca: [''],
      modelo: [''],
      detalle: [''],
      tipo: ['', Validators.required],
      consumible: ['false', Validators.required],
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
        this.stockForm.get('consumible')?.setValue('true');
      } else if (value === 'Dotacion Fija') {
        this.stockForm.get('consumible')?.setValue('false');
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
    this.dataSource.paginator = this.paginator;
    this.onTipoCustodiaChange();
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
      consumible: this.stockForm.value.consumible === 'true'
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
      this.cancelarEdicion();
      this.loadStock();
    });
  }
  
  private actualizarStock(stock: ProductosStock): void {
    this.stockService.actualizarStock(stock.id!, stock).subscribe(() => {
      this.stockService.showSuccessMessage('Stock Actualizado Con Éxito', 5);
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
      if((this.modoCustodia || this.modoQuitar) && this.legajoCustodia !== null){
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
      this.empleados = data.filter(empleado=>empleado.legajo!=this.menuData.empleado.legajo);
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
      tipo: stock.tipo,
      marca: stock.marca,
      modelo: stock.modelo,
      detalle: stock.detalle,
      consumible: stock.consumible ? 'true' : 'false'
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
          { name: 'numerosDeSerie',
            label: 'Números de Serie',
            type: 'serie-selector',
            required: false,
            stockId: stock.id,
            modo: this.modoAsignar ? 'asignar' : this.modoTransferir ? 'transferir' : 'quitar',
            legajoEmpleado: this.menuData.empleado.legajo }
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
          const enCustodia = stock.cantidadCustodia;
  
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
  
        const stockAsignado: StockParaOperar = {
          stock: stock,
          cantidad: cantidadIngresada,
          observaciones: result.observaciones?.trim() || null,
          numerosDeSerie: result.numerosDeSerie ?? []
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

  asignarStockYGenerarReporte(): void {
    const legajoCustodia = this.menuData?.empleado?.legajo;
    const legajoCarga = this.menuData?.empleadoLogueado?.legajo;
    const nombre = this.menuData?.empleado?.nombre;
  
    const items = this.stockParaOperar.map(stock => ({
      stockId: stock.stock.id!,
      cantidad: stock.cantidad,
      observaciones: stock.observaciones ?? undefined
    }));

    const numerosDeSerie: number[] = this.stockParaOperar.flatMap(stock =>
      stock.numerosDeSerie ? stock.numerosDeSerie.map((serie: any) => serie.value) : []
    );

    // ✅ 2️⃣ Si hay números de serie, asignarlos al legajo
    if (numerosDeSerie.length > 0) {
      console.log('Números de Serie que se van a enviar:', numerosDeSerie);
      this.stockService.asignarCustodiaNumerosDeSerie(numerosDeSerie, legajoCustodia).subscribe({
        next: () => {
          this.stockService.showSuccessMessage('Números de Serie Asignados Correctamente', 5);
        },
        error: (error) => {
          console.error('Error al asignar números de serie:', error);
          this.stockService.showErrorMessage('Error al asignar los números de serie', 5);
        }
      });
    }
  
    if (items.length && legajoCustodia) {
      this.stockService.asignarCustodia(items, legajoCustodia, legajoCarga).subscribe(() => {
        this.stockService.showSuccessMessage('Stock Asignado Con Éxito', 5);
  
        // Separar consumibles y no consumibles
        const consumibles = this.stockParaOperar.filter(i => i.stock.consumible);
        const noConsumibles = this.stockParaOperar.filter(i => !i.stock.consumible);
  
        // Generar reporte de consumibles
        if (consumibles.length) {
          this.generarReporteAsignacion(consumibles, 'acta-entrega-patrimonial');
        }
  
        // Generar reporte de no consumibles
        if (noConsumibles.length) {
          this.generarReporteAsignacion(noConsumibles, 'acta-alta-patrimonial');
        }
  
        // Limpiar selección y recargar stock
        this.stockParaOperar = [];
        this.stockParaOperarDS.data = [];
        this.dependenciaControl.setValue(null);
        this.loadStock();
      });
    }
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

  quitarCustodiaYGenerarReporte(): void {
    const legajoCustodia = this.menuData?.empleado?.legajo;
    const legajoCarga = this.menuData?.empleadoLogueado?.legajo;
    const nombre = this.menuData?.empleado?.nombre;
  
    const items = this.stockParaOperar.map(stock => ({
      stockId: stock.stock.id!,
      cantidad: stock.cantidad,
      observaciones: stock.observaciones ?? undefined
    }));

    const numerosDeSerie: number[] = this.stockParaOperar.flatMap(stock =>
      stock.numerosDeSerie ? stock.numerosDeSerie.map((serie: any) => serie.value) : []
    );

    // ✅ 2️⃣ Si hay números de serie, asignarlos al legajo
    if (numerosDeSerie.length > 0) {
      console.log('Números de Serie que se van a enviar:', numerosDeSerie);
      this.stockService.asignarCustodiaNumerosDeSerie(numerosDeSerie).subscribe({
        next: () => {
          this.stockService.showSuccessMessage('Números de Serie Asignados Correctamente', 5);
        },
        error: (error) => {
          console.error('Error al asignar números de serie:', error);
          this.stockService.showErrorMessage('Error al asignar los números de serie', 5);
        }
      });
    }
  
    if (items.length && legajoCustodia) {
      this.stockService.quitarCustodia(items, legajoCustodia, legajoCarga).subscribe(() => {
        this.stockService.showSuccessMessage('Stock Quitado Con Éxito', 5);
  
        // Generar reporte de baja
        this.generarReporteAsignacion(this.stockParaOperar, 'acta-baja-patrimonial');
  
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

  transferirCustodiaYGenerarReporte(): void {

    const legajoDestino = this.empleadoSeleccionado.legajo;
    const legajoOrigen = this.menuData?.empleado?.legajo;
    const legajoCarga = this.menuData?.empleadoLogueado?.legajo;
    const items = this.stockParaOperar.map(stock => ({
      stockId: stock.stock.id!,
      cantidad: stock.cantidad,
      observaciones: stock.observaciones ?? undefined
    }));

    const numerosDeSerie: number[] = this.stockParaOperar.flatMap(stock =>
      stock.numerosDeSerie ? stock.numerosDeSerie.map((serie: any) => serie.value) : []
    );

    // ✅ 2️⃣ Si hay números de serie, asignarlos al legajo
    if (numerosDeSerie.length > 0) {
      console.log('Números de Serie que se van a enviar:', numerosDeSerie);
      this.stockService.asignarCustodiaNumerosDeSerie(numerosDeSerie, legajoDestino).subscribe({
        next: () => {
          this.stockService.showSuccessMessage('Números de Serie Asignados Correctamente', 5);
        },
        error: (error) => {
          console.error('Error al asignar números de serie:', error);
          this.stockService.showErrorMessage('Error al asignar los números de serie', 5);
        }
      });
    }
  
    if (items.length && legajoOrigen && legajoDestino) {
      this.stockService.transferirCustodia(items, legajoOrigen, legajoDestino, legajoCarga).subscribe(() => {
        this.stockService.showSuccessMessage('Stock Transferido Con Éxito', 5);
  
        // Generar reporte de transferencia
        this.generarReporteAsignacion(this.stockParaOperar, 'acta-transferencia-patrimonial');
  
        // Limpiar selección y recargar stock
        this.stockParaOperar = [];
        this.stockParaOperarDS.data = [];
        this.dependenciaControl.setValue(null);
        this.loadStock();
      });
    }
  }

  generarReporteAsignacion(stockAsignado: StockParaOperar[], nombreReporte: string): void {

    let cantidadCopias=1;
    const legajoSeleccionadoLista = this.menuData?.empleado?.legajo;
    const nombreSeleccionadoLista = this.menuData?.empleado?.nombre;
    const legajoLogueado = this.menuData?.empleadoLogueado?.legajo;
    const nombreLogueado = this.menuData?.empleadoLogueado?.nombre;
    const dependenciaSeleccionada = this.dependenciaControl.value;
  
    const datos = stockAsignado.map(item => ({
      cantidad: item.cantidad,
      descripcion: [item.stock.productoNombre, item.stock.marca, item.stock.detalle]
                    .filter(part => part?.trim?.()).join(' '),
      oc: '0',
      remito: '0'
    }));
  
    let parametros: any = {};
  
    // Si el reporte es de entrega, agregamos los parámetros de entrega
    if (nombreReporte === 'acta-alta-patrimonial' 
              || nombreReporte === 'acta-entrega-patrimonial' 
                    || nombreReporte === 'acta-baja-patrimonial') {
      parametros.nombreEmpleado = nombreSeleccionadoLista;
      parametros.legajoEmpleado = String(legajoSeleccionadoLista);
      parametros.nombreEmpleadoEntrega = nombreLogueado;
      parametros.legajoEmpleadoEntrega = String(legajoLogueado);
      parametros.dependenciaAutoriza = dependenciaSeleccionada;
    }

    if (nombreReporte === 'acta-entrega-patrimonial') {
      cantidadCopias=2;
    }

    if (nombreReporte === 'acta-transferencia-patrimonial') {
      parametros.legajoEmpleado = String(legajoLogueado);
      parametros.legajoEmpleadoEntrega = String(legajoSeleccionadoLista);
      parametros.legajoEmpleadoRecibe = String(this.empleadoSeleccionado.legajo);
      parametros.nombreEmpleado = nombreLogueado;
      parametros.nombreEmpleadoEntrega = nombreSeleccionadoLista;
      parametros.nombreEmpleadoRecibe = this.empleadoSeleccionado.nombre;
    }
  
    const requestDto = {
      nombreReporte,
      cantidadCopias,
      parametros,
      datos
    };
  
    this.stockService.generarReporteConLista(requestDto).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      window.open(url);
    });
  }
  
  //download
  /*const a = document.createElement('a');
  a.href = url;
  a.download = 'acta-alta-patrimonial.pdf';
  a.click();
  window.URL.revokeObjectURL(url);*/

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
          { name: 'numeroDeSerie', label: 'Número de Serie', type: 'text', required: false, multiple: true },
          { name: 'observaciones', label: 'Observaciones', type: 'text', required: false }
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
            
            const numeros = result.numeroDeSerie instanceof Array
              ? result.numeroDeSerie.filter((n: string) => n && n.trim() !== '')
              : [];
  
            // 3. Si hay números de serie, los registramos
            if (numeros.length) {
              const registros = numeros.map((numero: string) => ({
                productoFlujo: { id: flujoCreado.id },
                numeroDeSerie: numero.trim(),
                empleadoCustodia: null // o legajo si aplica
              }));
  
              this.stockService.crearNumerosDeSerie(registros).subscribe(() => {
                this.stockService.showSuccessMessage('Stock y Números de Serie Registrados', 5);
                this.loadStock();
              });
  
            } else {
              this.stockService.showSuccessMessage('Stock Registrado', 5);
              this.loadStock();
            }
          });
        });
      }
    });
  }

  abrirModalBajaStock(stock: ProductosStock): void {
    const dialogRef = this.dialog.open(DynamicFormDialogComponent, {
      width: '820px',
      data: {
        title: `Dar De Baja Stock: ${stock.productoNombre} ${stock.detalle} ${stock.marca ?? ''}`,
        fields: [
          { name: 'cantidad', label: 'Cantidad a Dar de Baja', type: 'number', required: true },
          { name: 'motivoBaja', label: 'Motivo De Baja', type: 'text', required: true },
          { name: 'observaciones', label: 'Observaciones', type: 'text', required: false }
        ]
      }
    });
  
    dialogRef.afterClosed().subscribe(result => {
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
  
        const empleado = this.menuData?.empleadoLogueado;
        const legajo = empleado?.legajo;
  
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
            empleadoCarga: legajo,
            motivoBaja: result.motivoBaja?.trim(),
            observaciones: result.observaciones?.trim() || null
          };
  
          this.stockService.crearFlujoDeStock(flujo).subscribe(() => {
            this.stockService.showSuccessMessage('Baja De Stock Registrada Con Éxito', 5);
            this.loadStock();
          });
        });
      }
    });
  }

  verDetalles(stock: ProductosStock): void {

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
  
  verNumerosDeSerie(stock: ProductosStock, options?: { activo?: boolean, empleadoCustodia?: number }): void {
    this.stockService.getNumerosDeSeriePorStock(stock.id!, options).subscribe(numeros => {
      this.dialog.open(ListadoDialogComponent, {
        width: '1300px',
        data: {
          title: `Números de Serie del Stock ${stock.productoNombre} ${stock.detalle} ${stock.marca ?? ''}`,
          columns: ['numeroDeSerie', 'empleadoCustodia.legajo'],
          columnNames: {
            numeroDeSerie: 'Número de Serie',
            'empleadoCustodia.legajo': 'Custodia Legajo'
          },
          rows: numeros
        }
      });
    });
  }

  verCustodias(stock: ProductosStock): void {
    this.stockService.getCustodiasActivasPorStock(stock.id!).subscribe(custodias => {
      this.dialog.open(ListadoDialogComponent, {
        width: '1300px',
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
}
