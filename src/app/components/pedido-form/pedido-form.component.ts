import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
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
import { Pedido, PedidoDetalle } from '../../models/pedido.model';
import { forkJoin, map, Observable, startWith } from 'rxjs';
import { Presupuesto, PresupuestoDetalle } from '../../models/presupuesto.model';
import { ProveedorService } from '../../services/rest/proveedor/proveedor.service';
import { Proveedor } from '../../models/proveedor.model';
import { StockFormComponent, StockParaOperar } from '../stock-form/stock-form.component';
import { ReporteUtilsService } from '../../services/utils/reporte-utils.service';

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
  displayedPresupuestoColumns: string[] = [];
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
  pedidoSeleccionado!: Pedido | null;
  sinPermisoAdquisicion = true;
  destinos: any[] = [];
  direcciones: any[] = [];
  secretarias: any[] = [];
  secretariaControl = new FormControl();
  destinoControl = new FormControl();
  direccionControl = new FormControl();
  imputacionControl = new FormControl();
  filteredSecretarias!: Observable<any[]>;
  filteredDestinos!: Observable<any[]>;
  filteredDirecciones!: Observable<any[]>;
  filteredImputaciones!: Observable<any[]>;
  dependenciasConPermisoAdquisicion = ['Informatica', 'Compras', 'Patrimonio', 'Hacienda'];
  filtroTipoPedido: 'todos' | 'adquisicion' | 'interno' | 'viejo' = 'todos';
  prioridades = [
    { label: 'NORMAL (El Area Puede Funcionar)', value: 3 },
    { label: 'PRIORITARIO (El Area Encuentra Inconvenientes En Su Funcionamiento)', value: 2 },
    { label: 'URGENTE (El Area Encuentra Detenido El Funcionamiento)', value: 1 }
  ];
  presupuestos: Presupuesto[] = [];
  presupuestosDataSource = new MatTableDataSource<Presupuesto>();
  presupuestosDisplayedColumns: string[] = [];
  filterPresupuestoProveedor = '';
  filterPresupuestoRazon = '';
  filterPresupuestoFantasia = '';
  proveedores: Proveedor[] = [];
  presupuestoForm!: FormGroup;
  proveedorControl = new FormControl();
  filteredProveedores!: Observable<Proveedor[]>;
  modoEdicionPedido: boolean = false;
  
  @ViewChild('stockPaginator') stockPaginator!: MatPaginator;
  @ViewChild('pedidoPaginator') pedidoPaginator!: MatPaginator;
  @ViewChild('presupuestoPaginator') presupuestoPaginator!: MatPaginator;
  @ViewChild('stockSort') stockSort!: MatSort;
  @ViewChild('pedidoSort') pedidoSort!: MatSort;
  @ViewChild('presupuestoSort') presupuestoSort!: MatSort;

  constructor(private fb: FormBuilder,
                private comprasService: ComprasService,
                  private stockService: StockService,
                    private categoriaService: CategoriaService,
                      private dialog: MatDialog,
                        private utils: UtilsService,
                          private proveedorService: ProveedorService,
                            private reporteUtils: ReporteUtilsService,
                              @Inject('menuData') public menuData: any) {}

  ngOnInit(): void {

    this.modo = this.menuData?.modo || 'nuevo';
    this.pedidoSeleccionado = this.menuData?.pedidoSeleccionado || null;
    this.stockDisplayedColumns = ['categoria', 'producto', 'detalle', 'acciones'];
    this.presupuestosDisplayedColumns = ['numero', 'proveedor', 'razon', 'fantasia', 'total', 'observaciones', 'observaAdjudicacion', 'detalle', 'agregar'];
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

    this.pedidoForm.get('tipo')?.valueChanges.subscribe(tipo => {
      if (tipo === 'Interno') {
        this.pedidoForm.get('secretaria')?.clearValidators();
        this.pedidoForm.get('secretaria')?.setValue(null);
      } else {
        this.pedidoForm.get('secretaria')?.setValidators(Validators.required);
      }
      this.pedidoForm.get('secretaria')?.updateValueAndValidity();
    });
    this.configurarPermisoTipoPedido();
    this.cargarOpcionesPedido();
    if (this.modo === 'listado') {
      this.pedidosDisplayedColumns = ['numero', 'fechaSolicitud', 'nombreSolicitante', 'prioridad', 'presupuesto', 'estado', 'detalles'];
      this.obtenerPedidos();
    } else if (this.modo === 'edicion') {
      this.pedidosDisplayedColumns = ['numero','fechaSolicitud','nombreSolicitante','prioridad','presupuesto','autorizaPañol','autorizaHacienda','presupuestos', 'editar'];
      this.obtenerPedidos();
    } else if (this.modo === 'patrimonio') {
      this.pedidosDisplayedColumns = ['numero','fechaSolicitud','nombreSolicitante','prioridad','presupuesto','entregaStock'];
      this.obtenerPedidosInternosConStockDisponible();
    }
    if (this.modo === 'presupuesto' && this.pedidoSeleccionado?.numero) {
      this.cargarPresupuestos();
      this.initPresupuestoForm();
    }
  }

  ngAfterViewInit() {
    if (this.modo === 'nuevo') {
      this.dataSource.paginator = this.stockPaginator;
      this.dataSource.sort = this.stockSort;
    } else if (this.modo === 'listado' || this.modo === 'edicion') {
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
    } else if (this.modo === 'presupuesto') {
        this.presupuestosDataSource.filterPredicate = (data: Presupuesto, filter: string) => {
        const { proveedor, razon, fantasia } = JSON.parse(filter);
        const matchProveedor = String(data.proveedor?.cuit ?? '').toLowerCase().includes(proveedor);
        const matchRazon = String(data.razon ?? '').toLowerCase().includes(razon);
        const matchFantasia = String(data.fantasia ?? '').toLowerCase().includes(fantasia);
        return matchProveedor && matchRazon && matchFantasia;
      };
    }
  }

  initPresupuestoForm(): void {
    this.presupuestoForm = this.fb.group({
      proveedor: [null, Validators.required],
      observaciones: ['']
    });

    this.loadProveedores();
  }

  loadProveedores(): void {
    this.proveedorService.getProveedores().subscribe(data => {
      this.proveedores = data;

      this.filteredProveedores = this.proveedorControl.valueChanges.pipe(
       startWith(''),
       map(value => this.filtrarProveedores(value))
      );
    });
  }

  entregaDeStockPedidoInterno(p: Pedido): void {

    const nombreEmpleado = p.nombreSolicitante;
    const numeroPedido = p.numero;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        icon: 'help',
        iconColor: '#1976d2',
        title: 'Confirmar Entrega',
        message: `¿Está Seguro Que Desea Entregar El Stock Del Pedido Nº ${numeroPedido} Al Empleado ${nombreEmpleado}?`
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {

      if (confirmado) {

        this.comprasService.getPedidoPorId(p.numero!).subscribe({
          next: pedido => {
            const legajoSolicitante = pedido.legajoSolicitante;
            const legajoLogueado = this.menuData?.empleadoLogueado?.legajo;
            const nombreLogueado = this.menuData?.empleadoLogueado?.nombre;
            const dependencia = this.menuData?.empleadoLogueado?.dependencia;

            if (!pedido.detalles?.length || !legajoSolicitante || !legajoLogueado) {
              this.comprasService.showErrorMessage('Datos incompletos para procesar la entrega.', 5);
              return;
            }

            // Construir ítems de entrega
            const items = pedido.detalles
                          .filter((det): det is PedidoDetalle & { productoStock: { id: number } } =>
                            det.productoStock !== undefined && det.productoStock.id !== undefined
                          )
                          .map(det => ({
                            stockId: det.productoStock.id,
                            cantidad: det.cantidad,
                            observaciones: 'Entrega directa desde pedido interno'
                          }));

            // 1. Registrar el flujo de stock
            this.stockService.asignarCustodia(items, legajoSolicitante, legajoLogueado).subscribe(() => {
              this.utils.guardarLog(
                nombreLogueado,
                'Entrega Directa de Pedido Interno ' + JSON.stringify(items)
              );

              // 2. Generar reporte
              if (!pedido.detalles || pedido.detalles.length === 0) {
                this.stockService.showErrorMessage('El pedido no tiene detalles', 5);
                return;
              }

              const stockParaReporte: StockParaOperar[] = (pedido.detalles ?? [])
                  .filter(det => det.productoStock)
                  .map(det => ({
                    cantidad: det.cantidad,
                    stock: det.productoStock!, 
                    observaciones: undefined
                  }));

              this.reporteUtils.generarReporteAsignacion(stockParaReporte, 'acta-entrega-patrimonial', {
                generaReporteLegajo: legajoLogueado,
                generaReporteNombre: nombreLogueado,
                legajoEmpleado: legajoSolicitante,
                nombreEmpleado: pedido.nombreSolicitante,
                legajoEmpleadoEntrega: legajoLogueado,
                nombreEmpleadoEntrega: nombreLogueado,
                legajoEmpleadoRecibe: legajoSolicitante,
                nombreEmpleadoRecibe: pedido.nombreSolicitante,
                dependenciaAutoriza: dependencia
              });

              // 3. Marcar pedido como archivado
              this.comprasService.entregarPedido(pedido.numero!).subscribe(() => {
                this.comprasService.archivarPedido(pedido.numero!).subscribe(() => {
                  this.comprasService.showSuccessMessage('Pedido entregado y archivado con éxito', 5);
                  this.obtenerPedidosInternosConStockDisponible();
                });
              });
            });
          },
          error: () => {
            this.comprasService.showErrorMessage('No se pudo obtener el pedido completo.', 5);
          }
        });
      }
    });
  }

  filtrarProveedores(valor: string): Proveedor[] {
    const filtro = valor?.toLowerCase?.() || '';
    return this.proveedores.filter(p =>
      `${p.cuit} ${p.nombre || ''} ${p.nombreFantasia}`.toLowerCase().includes(filtro)
    );
  }

  displayProveedor(p?: Proveedor): string {
    return p ? `${p.cuit} - ${p.nombre || 'Sin nombre'} - ${p.nombreFantasia}` : '';
  }

  filtrarPresupuestos(): void {
    const filtro = {
      proveedor: this.filterPresupuestoProveedor?.toLowerCase() || '',
      razon: this.filterPresupuestoRazon?.toLowerCase() || '',
      fantasia: this.filterPresupuestoFantasia?.toLowerCase() || ''
    };

    this.presupuestosDataSource.filter = JSON.stringify(filtro);
  }

  verPresupuestos(pedido: Pedido): void {
    this.comprasService.getPedidoPorId(pedido.numero).subscribe({
      next: (pedidoCompleto: Pedido) => {
        this.pedidoSeleccionado = pedidoCompleto;
        this.modo = 'presupuesto';

        const event = new CustomEvent('navegarComponente', {
          detail: {
            componente: PedidoFormComponent,
            data: {
              modo: 'presupuesto',
              pedidoSeleccionado: pedidoCompleto,
              empleadoLogueado: this.menuData.empleadoLogueado
            }
          }
        });

        window.dispatchEvent(event);
      },
      error: () => {
        this.comprasService.showErrorMessage('No se pudo cargar el pedido completo', 3);
      }
    });
  }

  cargarPresupuestos(): void {
    if (!this.pedidoSeleccionado?.numero) return;

    this.comprasService.getPresupuestosPorPedido(this.pedidoSeleccionado.numero).subscribe({
      next: (data) => {
        this.presupuestos = data;
        this.presupuestosDataSource.data = data;
        this.presupuestosDataSource.sort = this.presupuestoSort;
        this.presupuestosDataSource.paginator = this.presupuestoPaginator;
      },
      error: () => this.comprasService.showErrorMessage('Error al cargar presupuestos', 3)
    });
  }

  guardarPresupuesto(): void {
    if (!this.presupuestoForm.valid || !this.pedidoSeleccionado) return;

    const proveedorSeleccionado = this.presupuestoForm.get('proveedor')?.value;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '500px',
      data: {
        message: `¿Está Seguro Que Desea Agregar Un Nuevo Presupuesto Al Pedido Nº ${this.pedidoSeleccionado.numero}?`,
        icon: 'help_outline',
        iconColor: '#f9a825',
        title: 'Confirmar Alta de Presupuesto'
      }
    })

    dialogRef.afterClosed().subscribe(confirmado => {
      if (!confirmado) return;

      const nuevoPresupuesto = new Presupuesto({
        proveedor: { cuit: proveedorSeleccionado.cuit },
        pedido: this.pedidoSeleccionado?.numero ?? 0,
        observaciones: this.presupuestoForm.get('observaciones')?.value || '',
        total: 0,
        nuevoSistema: true,
        razon: proveedorSeleccionado.nombre,
        fantasia: proveedorSeleccionado.nombreFantasia || '',
        numeroProveedor: '',
        validez: '',
        plazo: '',
        formaPago: '',
        observaAdjudicacion: ''
      });

      this.comprasService.crearPresupuesto(nuevoPresupuesto).subscribe({
        next: () => {
          this.comprasService.showSuccessMessage('Presupuesto Guardado Exitosamente', 3);
          this.limpiarPresupuestoForm();
          this.cargarPresupuestos();
        },
        error: () => {
          this.comprasService.showErrorMessage('Error Al Guardar El Presupuesto', 3);
        }
      });
    });
  }

  limpiarPresupuestoForm(): void {
    this.presupuestoForm.reset({
      proveedor: null,
      observaciones: ''
    });

    this.proveedorControl.setValue(null);
    this.proveedorControl.markAsPristine();
    this.proveedorControl.markAsUntouched();
  }

  agregarDetallePresupuesto(presupuesto: Presupuesto): void {
    if (!this.pedidoSeleccionado?.nuevoSistema) {
      this.dialog.open(ConfirmDialogComponent, {
        width: '500px',
        data: {
          message: 'No Se Puede Agregar Presupuesto A Un Pedido Generado En El Viejo Sistema.',
          icon: 'error_outline',
          iconColor: '#d32f2f',
          title: 'Sistema Antiguo',
          okOnly: true
        }
      });
      return;
    }

    if (!this.pedidoSeleccionado?.detalles || this.pedidoSeleccionado.detalles.length === 0) {
      this.comprasService.showErrorMessage('El pedido No Tiene Detalles Disponibles.', 3);
      return;
    }

    // ✅ Paso 1: Obtener detalles existentes del presupuesto (si los hay)
    this.comprasService.getDetallesPorPresupuesto(presupuesto.numero).subscribe(detallesExistentes => {
      const fields = this.pedidoSeleccionado?.detalles!.map((detalle, index) => {
        const existente = detallesExistentes.find(d => d.itemPedidoAdquisicion === detalle.id);
        return {
          name: `montoUnitario_${index}`,
          label: `Monto Unitario para: ${detalle.productoStock?.productoNombre} ${detalle.productoStock?.detalle}`,
          type: 'number',
          required: true,
          default: existente?.montoUnitario || 0
        };
      });

      // ✅ Paso 2: Mostrar el diálogo con valores precargados
      this.dialog.open(DynamicFormDialogComponent, {
        width: '820px',
        data: {
          title: `Agregar Detalles al Presupuesto Nº ${presupuesto.numero}`,
          fields
        }
      }).afterClosed().subscribe(formValue => {
        if (formValue) {
          const nuevosDetalles: PresupuestoDetalle[] = this.pedidoSeleccionado!.detalles!.map((detalle, index) => {
            return new PresupuestoDetalle({
              cantidad: detalle.cantidad,
              codigo: '',
              detalle: detalle.productoStock?.productoNombre + ' ' + detalle.productoStock?.detalle,
              rubro: '',
              montoUnitario: formValue[`montoUnitario_${index}`],
              observaciones: '',
              aprobado: false,
              adjudicado: 0,
              itemPedidoAdquisicion: detalle.id,
              comprasadquisicionpresupuesto: { numero: presupuesto.numero },
              productoStock: detalle.productoStock
            });
          });

          this.comprasService.crearDetallesPresupuesto(nuevosDetalles).subscribe({
            next: () => {
              this.comprasService.showSuccessMessage('Detalles Del Presupuesto Guardados Con Éxito', 3);
              this.cargarPresupuestos();
            },
            error: () => {
              this.comprasService.showErrorMessage('Error Al Guardar Los Detalles Del Presupuesto', 3);
            }
          });
        }
      });
    });
  }

  _filtrar(valor: string, lista: any[]): any[] {
    const filtro = this.normalizar(valor);
    return lista.filter(op => this.normalizar(op).includes(filtro));
  }

  _filtrarImputaciones(valor: string): any[] {
    const filtro = this.normalizar(valor);
    return this.imputaciones.filter(i =>
      this.normalizar(`${i.imputacion} - (${i.codigo}) - ${i.dependencia}`).includes(filtro)
    );
  }

  // Función de normalización para quitar acentos
  private normalizar(texto: string): string {
    return texto?.toLowerCase()
                .normalize("NFD")
                .replace(/\p{Diacritic}/gu, '') || '';
  }

  displayNombre(obj?: any): string {
    return obj ?? '';
  }

  displayImputacion = (codigo: string): string => {
    const imp = this.imputaciones.find(i => i.codigo === codigo);
    return imp ? `${imp.imputacion} - (${imp.codigo}) - ${imp.dependencia?.toUpperCase()}` : '';
  };

  crearFiltroPorNombre(control: FormControl, lista: any[]): Observable<any[]> {
    return control.valueChanges.pipe(
      startWith(''),
      map(valor => {
        const nombre = typeof valor === 'string' ? valor.toLowerCase() : '';
        return lista.filter(item => item.nombre?.toLowerCase().includes(nombre));
      })
    );
  }

  configurarPermisoTipoPedido(): void {
    const dependenciaUsuario = this.menuData?.empleadoLogueado?.dependencia?.toLowerCase() || '';

    this.sinPermisoAdquisicion = !this.dependenciasConPermisoAdquisicion
      .some(dep => dependenciaUsuario.includes(dep.toLowerCase()));

    this.pedidoForm.get('tipo')?.setValue('Interno');

    if (this.sinPermisoAdquisicion) {
      this.pedidoForm.get('tipo')?.disable();
    } else {
      this.pedidoForm.get('tipo')?.enable();
    }
  }

  cargarOpcionesPedido(): void {
    forkJoin({
      imputaciones: this.comprasService.getImputaciones(),
      destinos: this.comprasService.getDestinos(),
      direcciones: this.comprasService.getDirecciones(),
      secretarias: this.comprasService.getSecretarias()
    }).subscribe({
      next: ({ imputaciones, destinos, direcciones, secretarias }) => {
        this.imputaciones = imputaciones;
        this.destinos = destinos;
        this.direcciones = direcciones;
        this.secretarias = secretarias;

        this.filteredImputaciones = this.imputacionControl.valueChanges.pipe(
          startWith(''),
          map(value => this._filtrarImputaciones(value))
        );

        this.filteredDestinos = this.crearFiltroPorNombre(this.destinoControl, this.destinos);
        this.filteredDirecciones = this.crearFiltroPorNombre(this.direccionControl, this.direcciones);
        this.filteredSecretarias = this.crearFiltroPorNombre(this.secretariaControl, this.secretarias);

        // ⚠️ Ahora sí, asignamos los valores del pedido (después de tener opciones)
        if (this.modo === 'edicion-pedido' && this.pedidoSeleccionado) {
          this.cargarDatosPedidoSeleccionado();
        }
      },
      error: () => {
        this.comprasService.showErrorMessage('Error al cargar opciones del pedido', 3);
      }
    });
  }

  cargarDatosPedidoSeleccionado(): void {

    if (!this.pedidoSeleccionado) return;

    const tipo = this.pedidoSeleccionado.adquisicion ? 'Adquisicion' : 'Interno';

    // Buscar objetos por valor
    const secretariaObj = this.secretarias.find(s => s.nombre === this.pedidoSeleccionado!.secretaria);
    const imputacionObj = this.imputaciones.find(i => i.codigo === this.pedidoSeleccionado!.imputacion);
    const destinoObj = this.destinos.find(d => d.nombre === this.pedidoSeleccionado!.destino);

    // Setear valores al formulario
    this.pedidoForm.patchValue({
      tipo,
      secretaria: secretariaObj?.nombre ?? null,
      destino: destinoObj?.nombre ?? null,
      prioridad: this.pedidoSeleccionado.prioridad,
      imputacion: imputacionObj?.codigo ?? null,
      observaciones: this.pedidoSeleccionado.observacion
    });

    // Autocompletados visuales
    this.secretariaControl.setValue(secretariaObj?.nombre ?? '');
    this.imputacionControl.setValue(imputacionObj?.codigo ?? '');
    this.destinoControl.setValue(destinoObj?.nombre ?? '');

    // Deshabilitar todo
    //this.pedidoForm.disable();
    this.sinPermisoAdquisicion=true;
    this.secretariaControl.disable();
    this.imputacionControl.disable();
    this.destinoControl.disable();

    this.pedidoItems = (this.pedidoSeleccionado.detalles ?? []).map(det => {
      const ps = det.productoStock;
      return {
        id: ps?.id,
        producto: ps?.producto,
        categoria: ps?.categoria,
        detalle: ps?.detalle,
        tipo: ps?.tipo,
        marca: ps?.marca,
        modelo: ps?.modelo,
        cantidad: det.cantidad,
        observaciones: det.observaciones,
        usuario: this.pedidoSeleccionado?.nombreSolicitante
      };
    });
    this.pedidoDataSource = new MatTableDataSource(this.pedidoItems);

    this.modoEdicionPedido = true;
  }

  autorizarPedido(pedido: Pedido, tipo: 'pañol' | 'hacienda'): void {

    const tipoTexto = tipo === 'pañol' ? 'Pañol' : 'Hacienda';
    const autorizado = pedido[tipo] === true;
    const mensaje = autorizado
      ? `¿Está Seguro Que Desea Quitar La Autorización De ${tipoTexto} Para Este Pedido Numero ${pedido.numero}?`
      : `¿Está Seguro Que Desea Autorizar Este Pedido Numero ${pedido.numero} En ${tipoTexto}?`;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '500px',
      data: {
        message: mensaje,
        icon: 'check_circle',
        iconColor: autorizado ? '#d32f2f' : '#2e7d32',
        title: `Confirmar Autorización`,
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        const nuevoValor = !autorizado;

        this.comprasService.actualizarAutorizacion(pedido.numero, tipo, nuevoValor)
          .subscribe({
            next: () => {
              this.obtenerPedidos();
              this.comprasService.showSuccessMessage(`Autorización De ${tipoTexto} Actualizada`, 3);
            },
            error: () => {
              this.comprasService.showErrorMessage(`Error Al Actualizar Autorización De ${tipoTexto}`, 3);
            }
          });
      }
    });
  }

  puedeAutorizarPanol(pedido: Pedido): boolean {
    const dep = this.menuData?.empleadoLogueado?.dependencia?.toLowerCase();
    return (dep === 'patrimonio' || dep === 'informatica') && (!pedido['hacienda']);
  }

  puedeAutorizarHacienda(pedido: Pedido): boolean {
    const dep = this.menuData?.empleadoLogueado?.dependencia?.toLowerCase();
    return (dep === 'hacienda' || dep === 'informatica') && (pedido['pañol']);
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

      // Nuevos estados internos
      case 'Interno: Pendiente': return 'estado-interno-pendiente';
      case 'Interno: Autorizado Por Pañol': return 'estado-interno-panol';
      case 'Interno: Autorizado Por Hacienda': return 'estado-interno-hacienda';
      case 'Interno: Listo Para Entrega': return 'estado-interno-entrega';
      case 'Interno: Sin Stock': return 'estado-interno-sinstock';
      case 'Interno: Archivado': return 'estado-interno-archivado';
      case 'Interno: Archivado Con Stock Entregado': return 'estado-interno-archivado-entregado';

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

  obtenerPedidosInternosConStockDisponible(): void {
    this.comprasService.getPedidosInternosConStockDisponible().subscribe(data => {
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

  abrirPresupuestoDetalle(presupuesto: Presupuesto): void {
    let rows: any[] = [];

    if (presupuesto.nuevoSistema) {
      rows = presupuesto.detalles?.map(d => ({
        detalle: d.productoStock?.productoNombre + ' ' + d.productoStock?.detalle,
        cantidad: d.cantidad,
        montoUnitario: d.montoUnitario,
        adjudicado: d.adjudicado
      })) || [];
    } else {
      rows = presupuesto.detalles?.map(d => ({
        detalle: d.detalle,
        cantidad: d.cantidad,
        montoUnitario: d.montoUnitario,
        adjudicado: d.adjudicado
      })) || [];
    }

    this.dialog.open(ListadoDialogComponent, {
      width: '1300px',
      data: {
        title: `Detalles del Presupuesto Nº ${presupuesto.numero}`,
        columns: ['detalle', 'cantidad', 'montoUnitario', 'adjudicado'],
        columnNames: {
          detalle: 'Detalle',
          cantidad: 'Cantidad',
          montoUnitario: 'Monto Unitario',
          adjudicado: 'Adjudicado'
        },
        rows,
        filterableColumns: ['detalle']
      }
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
    const pedido = {
      fechaSolicitud: now.toISOString(),
      nombreSolicitante: this.menuData?.empleadoLogueado?.nombre ?? 'Empleado X',
      prioridad: this.pedidoForm.value.prioridad,
      presupuesto: 0,
      secretaria: this.pedidoForm.value.secretaria ?? '',
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

    if (this.modo === 'edicion-pedido' && this.pedidoSeleccionado?.numero) {
      // MODO EDICIÓN
      this.comprasService.actualizarPedido(this.pedidoSeleccionado.numero, pedido).subscribe({
        next: () => {
          this.guardarDetallesDelPedido(this.pedidoSeleccionado!.numero);
        },
        error: (err) => {
          console.error('Error al actualizar el pedido:', err);
          this.mostrarDialogoOk('Error al actualizar el pedido. Intente nuevamente.', {
            icono: 'error_outline',
            colorIcono: '#d32f2f',
            titulo: 'Error'
          });
        }
      });
    } else {
      // MODO NUEVO
      this.comprasService.crearPedido(pedido).subscribe({
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

    this.comprasService.crearDetallesDelPedido(detalles).subscribe({
      next: () => {
        this.mostrarDialogoOk('Pedido guardado con los detalles correctamente.', {
          icono: 'check_circle',
          colorIcono: '#198754',
          titulo: 'Éxito'
        });
        this.resetearFormulario();
        this.irModoEdicion();
      },
      error: () => {
        this.mostrarDialogoOk('No se pudieron guardar los detalles del pedido.', {
          icono: 'error_outline',
          colorIcono: '#d32f2f',
          titulo: 'Error'
        });
      }
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
        columns: ['categoria.nombre', 'producto.nombre', 'detalle', 'cantidad', 'observaciones', 'usuario'],
        columnNames: {
          'categoria.nombre': 'Categoría',
          'producto.nombre': 'Producto',
          'detalle': 'Detalle',
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

  borrarCampoSeleccionado(control: FormControl, nombreEnFormGroup: string): void {
    control.setValue('');
    this.pedidoForm.get(nombreEnFormGroup)?.setValue(null);
    this.pedidoForm.updateValueAndValidity();
  }

  editarPedido(pedido: Pedido): void {
    this.comprasService.getPedidoPorId(pedido.numero!).subscribe({
      next: (pedidoCompleto: Pedido) => {
        const event = new CustomEvent('navegarComponente', {
          detail: {
            componente: PedidoFormComponent,
            data: {
              modo: 'edicion-pedido',
              pedidoSeleccionado: pedidoCompleto,
              empleadoLogueado: this.menuData.empleadoLogueado
            }
          }
        });

        window.dispatchEvent(event);
      },
      error: () => {
        this.comprasService.showErrorMessage('No se pudo cargar el pedido completo', 3);
      }
    });
  }

  irModoEdicion(): void {
    const event = new CustomEvent('navegarComponente', {
      detail: {
        componente: PedidoFormComponent,
        data: {
          modo: 'edicion',
          empleadoLogueado: this.menuData.empleadoLogueado
        }
      }
    });

    window.dispatchEvent(event);
  }
}