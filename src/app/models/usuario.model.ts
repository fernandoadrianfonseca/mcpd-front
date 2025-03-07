export class Usuario {
    id?: number;
    nombre!: string;
    legajo!: string;
    perfil!: string;
    dependencia!: string;
    vence!: Date;
    modulo!: number;
  
    constructor(init?: Partial<Usuario>) {
      Object.assign(this, init);
    }
  }