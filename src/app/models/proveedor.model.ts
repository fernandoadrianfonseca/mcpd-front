import { Contribuyente } from './contribuyente.model';

export class Proveedor {
  cuit!: number;
  nombre?: string;
  nombreFantasia!: string;
  empleador: boolean = false;
  iibb?: string;
  cbu?: string;
  saldo: number = 0;
  multilateral: boolean = false;
  contribuyente?: Contribuyente;

  constructor(init?: Partial<Proveedor>) {
    Object.assign(this, init);
  }
}