export class StockProducto {
  productoId!: number;
  productoNombre!: string;
  categoriaNombre!: string;
  total!: number;
  totalCustodia!: number;
  totalDisponible!: number;

  constructor(init?: Partial<StockProducto>) {
    Object.assign(this, init);
  }
}