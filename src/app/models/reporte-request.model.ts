export class ReporteRequest {
  nombreReporte!: string;
  cantidadCopias!: number;
  parametros!: any;
  datos!: any[];

  constructor(init?: Partial<ReporteRequest>) {
    Object.assign(this, init);
  }
}
