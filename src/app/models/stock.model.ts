import { Categoria } from "./categoria.model";
import { Producto } from "./producto.model";

export class ProductosStock {
  id?: number;
  categoria!: Categoria;
  categoriaNombre!: string;
  producto!: Producto;
  productoNombre!: string;
  cantidad!: number;
  precio?: number;
  marca?: string;
  modelo?: string;
  detalle?: string;
  unidades?: number;
  numeroDeSerie?: string;
  fechaDeCarga?: string;
  updated?: string;
  tipo!: string;
  ordenDeCompra?: string;
  remito?: string;
  custodia?: number;
  acta?: number;
  transfiere?: number;
  motivoBaja?: string;
  fechaDeDevolucion?: string;
  observaciones?: string;

  constructor(init?: Partial<ProductosStock>) {
    Object.assign(this, init);
  }
}
