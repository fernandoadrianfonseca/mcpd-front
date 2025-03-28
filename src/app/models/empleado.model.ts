export class Empleado {
    legajo!: number;
    cuil!: string;
    nombre?: string;
    categoria!: string;
    agrupamiento!: string;
    dependencia!: string;
    sistema!: boolean;
  
    constructor(init?: Partial<Empleado>) {
      Object.assign(this, init);
    }
}
