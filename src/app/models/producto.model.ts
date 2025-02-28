export class Producto {
  id?: number;
  nombre!: string;
  categoria!: number;
  categoriaNombre!: string;

  constructor(init?: Partial<Producto>) {
    Object.assign(this, init);
  }
}
