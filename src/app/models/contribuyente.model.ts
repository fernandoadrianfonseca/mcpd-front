export class Contribuyente {
    cuit!: number;
    nombre!: string;
    responsabilidad!: string;
    sexo!: string;
    domicilio?: string;
    telefono?: string;
    mail?: string;
    nacimiento?: Date;
    pais: string = "Argentina";
    provincia: string = "Santa Cruz";
    ciudad: string = "Puerto Deseado";
    codigoPostal: string = "9050";
  
    constructor(init?: Partial<Contribuyente>) {
      Object.assign(this, init);
    }
  }