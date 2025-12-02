export class StockCategoria {
  categoriaId!: number;
  categoriaNombre!: string;
  total!: number;
  totalCustodia!: number;
  totalDisponible!: number;

  constructor(init?: Partial<StockCategoria>) {
    Object.assign(this, init);
  }
}