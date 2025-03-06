import { Categoria } from "./categoria.model";

export class Producto {
  id?: number;
  nombre!: string;
  categoria!: Categoria;
  categoriaNombre!: string;

  constructor(init?: Partial<Producto>) {
    Object.assign(this, init);
  }
}
