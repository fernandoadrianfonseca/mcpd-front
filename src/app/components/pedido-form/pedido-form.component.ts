import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../modules/material/material.module';
import { ComprasService } from '../../services/rest/compras/compras.service';
import { MatSelectChange } from '@angular/material/select';
import { MatTableDataSource } from '@angular/material/table';
import { StockService } from '../../services/rest/stock/stock.service';
import { ProductosStock } from '../../models/stock.model';
import { CategoriaService } from '../../services/rest/categoria/categoria.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DynamicFormDialogComponent } from '../dynamic-form-dialog/dynamic-form-dialog.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { ListadoDialogComponent } from '../listado-dialog/listado-dialog.component';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { UtilsService } from '../../services/utils/utils.service';
import { Pedido } from '../../models/pedido.model';

interface PedidoItem {
  categoria: any;
  producto: any;
  cantidad: number;
  observaciones: string;
  usuario: string;
}

@Component({
  selector: 'pedido-form',
  templateUrl: './pedido-form.component.html',
  styleUrls: ['./pedido-form.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MaterialModule]
})
export class PedidoFormComponent implements OnInit {

  pedidoForm!: FormGroup;
  imputaciones: any[] = [];
  stockDisplayedColumns: string[] = [];
  stock: ProductosStock[] = [];
  filteredStock: ProductosStock[] = [];
  dataSource = new MatTableDataSource<ProductosStock>([]);
  pedidoItems: any[] = [];
  pedidoDataSource = new MatTableDataSource(this.pedidoItems);
  categorias: any[] = [];
  filterProducto = '';
  filterDetalle = '';
  filterCategoria: string | null = null;
  filterNumero: string = '';
  filterFecha: string = '';
  filterSolicitante: string = '';
  filterPrioridad: string = '';
  filterEstado: string = '';
  modo: string = '';
  pedidosDisplayedColumns: string[] = [];
  pedidosDataSource = new MatTableDataSource<Pedido>([]);
  pedidoSeleccionado!: Pedido;
  
  secretarias = [
    'JEFATURA DE GABINETE',
    'SECRETARIA DE HACIENDA',
    'SECRETARIA DE GP Y AS. MUN.',
    'SECRETARIA DE PLANEAMIENTO URBANO',
    'SECRETARIA DE GOBIERNO',
    'SECRETARIA DE DESARROLLO SOCIAL',
    'INTENDENCIA',
    'HCD',
    'JMF',
    'JMDC'
  ];

  prioridades = [
    { label: 'NORMAL (El Area Puede Funcionar)', value: 3 },
    { label: 'PRIORITARIO (El Area Encuentra Inconvenientes En Su Funcionamiento)', value: 2 },
    { label: 'URGENTE (El Area Encuentra Detenido El Funcionamiento)', value: 1 }
  ];

  destinos = ['Destino 1', 'Destino 2', 'Destino 3', 'Destino 4', 'Destino 5'];
  filtroTipoPedido: 'todos' | 'adquisicion' | 'interno' | 'viejo' = 'todos';

  @ViewChild('stockPaginator') stockPaginator!: MatPaginator;
  @ViewChild('pedidoPaginator') pedidoPaginator!: MatPaginator;
  @ViewChild('stockSort') stockSort!: MatSort;
  @ViewChild('pedidoSort') pedidoSort!: MatSort;

  constructor(private fb: FormBuilder,
                private comprasService: ComprasService,
                  private stockService: StockService,
                    private categoriaService: CategoriaService,
                      private dialog: MatDialog,
                        private utils: UtilsService,
                          @Inject('menuData') public menuData: any) {}

  ngOnInit(): void {

    this.modo = this.menuData?.modo || 'nuevo';
    this.stockDisplayedColumns = ['categoria', 'producto', 'detalle', 'acciones'];
    this.obtenerStock();
    this.obtenerCategorias();
    this.pedidoForm = this.fb.group({
      tipo: ['Interno', Validators.required],
      secretaria: [null, Validators.required],
      destino: [null, Validators.required],
      prioridad: [3, Validators.required],
      imputacion: [null, Validators.required], 
      observaciones: ['']
    });

    this.comprasService.getImputaciones().subscribe(data => {
      this.imputaciones = data;
    });

    if (this.modo === 'listado') {
      this.pedidosDisplayedColumns = ['numero', 'fechaSolicitud', 'nombreSolicitante', 'prioridad', 'presupuesto', 'estado', 'detalles'];
      this.obtenerPedidos();
    }
  }

  ngAfterViewInit() {
    if (this.modo === 'nuevo') {
      this.dataSource.paginator = this.stockPaginator;
      this.dataSource.sort = this.stockSort;
    } else if (this.modo === 'listado') {
      this.pedidosDataSource.paginator = this.pedidoPaginator;
      this.pedidosDataSource.sort = this.pedidoSort;
      this.pedidosDataSource.filterPredicate = (data: Pedido, filter: string) => {
        const { numero, fecha, solicitante, prioridad, tipoPedido, estado } = JSON.parse(filter);

        const numeroMatch = !numero || data.numero.toString().includes(numero);
        const fechaMatch = !fecha || this.utils.formatDateToDDMMYYYYUniversal(data.fechaSolicitud).includes(fecha);
        const solicitanteMatch = !solicitante || data.nombreSolicitante.toLowerCase().includes(solicitante.toLowerCase());
        const prioridadTexto = data.prioridad === 1 ? 'Urgente' : data.prioridad === 2 ? 'Prioritario' : 'Normal';
        const prioridadMatch = !prioridad || prioridadTexto === prioridad;
        const estadoMatch = !estado || (!!data.estado && data.estado.toLowerCase() === estado.toLowerCase());

        // filtro de tipo
        let tipoMatch = true;
        if (tipoPedido === 'adquisicion') {
          tipoMatch = data.adquisicion === true;
        } else if (tipoPedido === 'interno') {
          tipoMatch = data.adquisicion === false;
        } else if (tipoPedido === 'viejo') {
          tipoMatch = data.nuevoSistema === false;
        }

        return numeroMatch && fechaMatch && solicitanteMatch && prioridadMatch && tipoMatch && estadoMatch;
      };
    }
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'Pendiente': return 'estado-pendiente';
      case 'En Proceso De Presupuesto': return 'estado-presupuesto';
      case 'En Despacho': return 'estado-despacho';
      case 'Rechazados': return 'estado-rechazado';
      case 'Con Orden De Compra': return 'estado-orden-compra';
      case 'Facturada': return 'estado-facturada';
      case 'Pagado': return 'estado-pagado';
      default: return '';
    }
  }

  filtrarPorTipo(tipo: 'todos' | 'adquisicion' | 'interno' | 'viejo') {
    this.filtroTipoPedido = tipo;
    this.filtrarPedidos();
  }

  filtrarPedidos() {
    const filterObject = {
      numero: this.filterNumero,
      fecha: this.filterFecha,
      solicitante: this.filterSolicitante,
      prioridad: this.filterPrioridad,
      tipoPedido: this.filtroTipoPedido,
      estado: this.filterEstado
    };
    this.pedidosDataSource.filter = JSON.stringify(filterObject);
  }

  obtenerPedidos(): void {
    this.comprasService.getPedidos().subscribe(data => {
      this.pedidosDataSource.data = data;
    });
  }

  abrirListadoDetalle(pedido: Pedido) {
    this.comprasService.getPedidoPorId(pedido.numero).subscribe((pedidoCompleto: Pedido) => {
      this.pedidoSeleccionado = pedidoCompleto;

      let rows: any[] = [];

      if (pedidoCompleto.nuevoSistema) {
        rows = pedidoCompleto.detalles?.map(d => ({
          detalle: d.productoStock?.productoNombre + ' ' + d.productoStock?.detalle,
          cantidad: d.cantidad,
          montoUnitario: d.montoUnitario,
          observaciones: d.observaciones,
          marca: d.productoStock?.marca,
          tipo: d.productoStock?.tipo
        })) || [];
      } else {
        rows = pedidoCompleto.detalles?.map(d => ({
          detalle: d.detalle,
          cantidad: d.cantidad,
          montoUnitario: d.montoUnitario,
          observaciones: d.observaciones,
          marca: d.marca,
          tipo: d.tipo
        })) || [];
      }

      this.dialog.open(ListadoDialogComponent, {
        width: '1300px',
        data: {
          title: `Detalles del Pedido Nº ${pedidoCompleto.numero}`,
          columns: ['detalle', 'marca', 'cantidad', 'montoUnitario', 'observaciones', 'tipo'],
          columnNames: {
            detalle: 'Detalle',
            cantidad: 'Cantidad',
            montoUnitario: 'Monto Unitario',
            observaciones: 'Observaciones',
            marca: 'Marca',
            tipo: 'Tipo'
          },
          rows,
          filterableColumns: ['detalle', 'marca', 'tipo']
        }
      });

    }, error => {
      console.error('Error al obtener el pedido:', error);
      this.mostrarDialogoOk('No se pudieron cargar los detalles del pedido.', {
        icono: 'error_outline',
        colorIcono: '#d32f2f',
        titulo: 'Error'
      });
    });
  }


  onSubmit(): void {
    if (!this.pedidoForm.valid) {
      return;
    }

    if (!this.pedidoItems.length) {
      this.mostrarDialogoOk('No hay productos agregados al pedido.', {
        icono: 'info',
        colorIcono: '#1976d2',
        titulo: 'Sin Productos',
        textoBotonOk: 'Entendido'
      });
      return;
    }

    const tipoPedido = this.pedidoForm.value.tipo;
    const icon = this.pedidoForm.value.tipo === 'Adquisicion' ? 'shopping_cart' : 'description';
    const iconColor = this.pedidoForm.value.tipo === 'Adquisicion' ? '#1976d2' : '#2e7d32';

    const confirmDialog = this.dialog.open(ConfirmDialogComponent, {
      width: '500px',
      data: {
        message: `¿Está seguro que desea cargar el pedido ${tipoPedido}?`,
        icon: icon,
        iconColor: iconColor,
        title: 'Confirmar Carga',
        okLabel: 'Sí, Cargar'
      }
    });

    confirmDialog.afterClosed().subscribe(result => {
      if (result === true) {
        this.guardarPedido();
      }
    });
  }

  private guardarPedido(): void {
    const now = new Date();
    const nuevoPedido = {
      fechaSolicitud: now.toISOString(),
      nombreSolicitante: this.menuData?.empleadoLogueado?.nombre ?? 'Empleado X',
      prioridad: this.pedidoForm.value.prioridad,
      presupuesto: 0,
      secretaria: this.pedidoForm.value.secretaria,
      direccion: '',
      observacion: this.pedidoForm.value.observaciones ?? '',
      administracion: this.menuData?.empleadoLogueado?.administracion ?? '',
      hacienda: false,
      archivado: false,
      despacho: false,
      presupuestado: false,
      numeroInstrimentoAdquisicion: null,
      destino: this.pedidoForm.value.destino,
      completo: false,
      ofertado: false,
      pase: '',
      obra: false,
      directa: false,
      nota: 'NA',
      presentaPre: false,
      presentes: null,
      pañol: 0,
      motivoRechazo: null,
      imputacion: this.pedidoForm.value.imputacion,
      legajoSolicitante: this.menuData?.empleadoLogueado?.legajo ?? null,
      haciendaEmpleado: null,
      haciendaLegajoEmpleado: null,
      pañolEmpleado: null,
      pañolLegajoEmpleado: null,
      adquisicion: this.pedidoForm.value.tipo === 'Adquisicion',
      nuevoSistema: true
    };

    this.comprasService.crearPedido(nuevoPedido).subscribe({
      next: (pedidoCreado) => {
        console.log('Pedido creado:', pedidoCreado);
        this.guardarDetallesDelPedido(pedidoCreado.numero);
      },
      error: (err) => {
        console.error('Error al crear el pedido:', err);
        this.mostrarDialogoOk('Error al guardar el pedido. Intente nuevamente.', {
          icono: 'error_outline',
          colorIcono: '#d32f2f',
          titulo: 'Error'
        });
      }
    });
  }


  guardarDetallesDelPedido(idPedido: number): void {

    const detalles = this.pedidoItems.map(item => ({
      pedido: { numero: idPedido },
      cantidad: item.cantidad,
      codigo: '',
      detalle: '',
      montoUnitario: 0,
      observaciones: item.observaciones ?? '',
      rubro: '',
      planDeCuentas: '',
      imputacion: this.pedidoForm.value.imputacion,
      presupuestado: false,
      adquirido: false,
      marca: '',
      tipo: '',
      productoStock: { id: item.id } 
    }));

    let exitos = 0;
    let fallos = 0;

    detalles.forEach(detalle => {
      this.comprasService.crearPedidoDetalle(detalle).subscribe({
        next: () => {
          exitos++;
          if (exitos + fallos === detalles.length) {
            this.mostrarDialogoOk('Pedido guardado con sus productos correctamente.', {
              icono: 'check_circle',
              colorIcono: '#198754',
              titulo: 'Éxito'
            });
            this.resetearFormulario();
          }
        },
        error: () => {
          fallos++;
          if (exitos + fallos === detalles.length) {
            this.mostrarDialogoOk('Algunos productos no se pudieron guardar.', {
              icono: 'warning',
              colorIcono: '#ff9800',
              titulo: 'Advertencia'
            });
          }
        }
      });
    });
  }

  resetearFormulario(): void {
    this.pedidoForm.reset({
      tipo: 'Interno',
      secretaria: null,
      destino: null,
      prioridad: 3,
      imputacion: null,
      observaciones: ''
    });
    this.pedidoItems = [];
    this.pedidoDataSource.data = [];
  }

  obtenerCategorias(): void {
    this.categoriaService.getCategorias().subscribe(data => {
      this.categorias = data;
    });
  }

  obtenerStock(): void {
    this.stockService.getStock().subscribe(data => {
      this.stock = data;
      this.filtrarStock();
    });
  }

  filtrarStock(): void {
    this.filteredStock = this.stock.filter(s =>
      (!this.filterProducto || s.producto?.nombre?.toLowerCase().includes(this.filterProducto.toLowerCase())) &&
      (!this.filterDetalle || s.detalle?.toLowerCase().includes(this.filterDetalle.toLowerCase())) &&
      (!this.filterCategoria || s.categoria?.nombre === this.filterCategoria)
    );
    this.dataSource.data = this.filteredStock;
  }

  agregarAlPedido(producto: any) {
    const dialogRef = this.dialog.open(DynamicFormDialogComponent, {
      width: '820px',
      data: {
        title: `Agregar al Pedido: ${producto.producto?.nombre} ${producto.marca ? producto.marca : ''} ${producto?.detalle}`,
        fields: [
          { name: 'cantidad', label: 'Cantidad', type: 'number', required: true },
          { name: 'observaciones', label: 'Observaciones del Producto', type: 'text', required: false }
        ]
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const cantidad = Number(result.cantidad);
        
        if (!Number.isInteger(cantidad) || cantidad <= 0) {
          this.mostrarDialogoOk(
            'La cantidad debe ser un número entero positivo.',
            {
              icono: 'error_outline',
              colorIcono: '#d32f2f',
              titulo: 'Cantidad inválida'
            }
          );
          return;
        }

        const pedidoItem = {
          ...producto,
          cantidad,
          observaciones: result.observaciones?.trim() || '',
          usuario: this.menuData?.empleadoLogueado?.nombre ?? 'Empleado X'
        };

        this.pedidoItems.push(pedidoItem);
        console.log('Pedido actualizado:', this.pedidoItems);
        this.comprasService.showSuccessMessage('Stock Agregado Al Pedido Con Éxito', 5);
      }
    });
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

  verPedidoActual(): void {

    if (!this.pedidoItems.length) {
      this.mostrarDialogoOk('No hay productos agregados al pedido.', {
        icono: 'info',
        colorIcono: '#1976d2',
        titulo: 'Sin Productos',
        textoBotonOk: 'Entendido'
      });
      return;
    }

    this.dialog.open(ListadoDialogComponent, {
      width: '1300px',
      data: {
        title: 'Productos Agregados al Pedido',
        columns: ['categoria.nombre', 'producto.nombre', 'cantidad', 'observaciones', 'usuario'],
        columnNames: {
          'categoria.nombre': 'Categoría',
          'producto.nombre': 'Producto',
          cantidad: 'Cantidad',
          observaciones: 'Observaciones',
          usuario: 'Usuario'
        },
        dataSource: this.pedidoDataSource,
        rows: this.pedidoItems,
        filterableColumns: ['all'],
        onRemove: (item: PedidoItem) => this.quitarDelPedido(item) // 👈 pasamos callback
      }
    });
  }

  quitarDelPedido(item: any): void {

    const confirmRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        message: `¿Está seguro que desea eliminar este producto del pedido?`,
        icon: 'warning',
        iconColor: '#d32f2f',
        title: 'Confirmar eliminación'
      }
    });

    confirmRef.afterClosed().subscribe(result => {
      if (result === true) {
       
        this.pedidoItems = this.pedidoItems.filter(p => p !== item);
        this.pedidoDataSource.data = this.pedidoItems;
        console.log('Pedido actualizado:', this.pedidoItems);
        this.comprasService.showSuccessMessage('Producto quitado del pedido', 3);
      }
    });
  }

}