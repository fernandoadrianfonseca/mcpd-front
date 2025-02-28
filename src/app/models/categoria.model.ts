export class Categoria {
    id?: number | string;
    nombre!: string;

    constructor(init?: Partial<Categoria>) {
        Object.assign(this, init);
      }
}