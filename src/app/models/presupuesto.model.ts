import { ProductosStock } from "./stock.model";

export class PresupuestoDetalle {
  id?: number;
  comprasadquisicionpresupuesto?: { numero: number | undefined }; 
  cantidad!: number;
  codigo!: string;
  detalle!: string;
  rubro!: string;
  montoUnitario!: number;
  observaciones?: string;
  aprobado!: boolean;
  itemPedidoAdquisicion?: number;
  adjudicado!: number;
  productoStock?: ProductosStock;

  constructor(init?: Partial<PresupuestoDetalle>) {
    Object.assign(this, init);
  }
}

export class Presupuesto {
  numero?: number;
  fecha?: string;
  proveedor!: {
    cuit: string;
  };
  pedido!: number;
  numeroProveedor!: string;
  validez!: string;
  plazo!: string;
  formaPago!: string;
  observaciones!: string;
  observaAdjudicacion!: string;
  razon?: string;
  fantasia?: string;
  total!: number;
  nuevoSistema!: boolean
  detalles?: PresupuestoDetalle[];

  constructor(init?: Partial<Presupuesto>) {
    Object.assign(this, init);
  }
}