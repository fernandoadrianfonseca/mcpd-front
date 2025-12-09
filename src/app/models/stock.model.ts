import { Categoria } from "./categoria.model";
import { Producto } from "./producto.model";

export class ProductosStock {
  id?: number;
  categoria!: Categoria;
  categoriaNombre!: string;
  producto!: Producto;
  productoNombre!: string;
  cantidad!: number;
  cantidadCustodia!: number;
  cantidadCustodiaLegajo?: number;
  precio?: number;
  marca?: string;
  modelo?: string;
  detalle?: string;
  fechaDeCarga?: string;
  updated?: string;
  tipo!: string;
  consumible!: boolean;
  conDevolucion?: boolean;

  constructor(init?: Partial<ProductosStock>) {
    Object.assign(this, init);
  }
}
