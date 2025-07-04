import { ProductosStock } from "./stock.model";

export class PedidoDetalle {
  id!: number;
  cantidad!: number;
  codigo!: string;
  detalle!: string;
  montoUnitario!: number;
  observaciones!: string;
  rubro!: string;
  planDeCuentas!: string;
  imputacion!: string;
  presupuestado!: boolean;
  adquirido!: boolean;
  marca!: string;
  tipo!: string;
  productoStock?: ProductosStock;

  constructor(init?: Partial<PedidoDetalle>) {
    Object.assign(this, init);
  }
}

export class Pedido {
  numero!: number;
  fechaSolicitud!: string;
  nombreSolicitante!: string;
  prioridad!: number;
  presupuesto!: number;
  secretaria!: string;
  direccion!: string;
  observacion!: string;
  administracion!: string;
  hacienda!: boolean;
  archivado!: boolean;
  despacho!: boolean;
  presupuestado!: boolean;
  numeroInstrumentoAdquisicion?: string;
  destino!: string;
  completo!: boolean;
  ofertado!: boolean;
  pase!: string;
  obra!: boolean;
  directa!: boolean;
  nota!: string;
  presentaPre!: boolean;
  presentes?: string;
  pañol!: boolean;
  motivoRechazo?: string;
  imputacion!: string;
  legajoSolicitante!: number;
  haciendaEmpleado?: string;
  haciendaLegajoEmpleado?: number;
  pañolEmpleado?: string;
  pañolLegajoEmpleado?: number;
  adquisicion!: boolean;
  nuevoSistema!: boolean;
  updated?: string;
  detalles?: PedidoDetalle[];

  constructor(init?: Partial<Pedido>) {
    Object.assign(this, init);
  }
}