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

export class AuthResponse  {
  token!: string;
  usuario!: Usuario;

  constructor(init?: Partial<AuthResponse>) {
      Object.assign(this, init);
  }
}
