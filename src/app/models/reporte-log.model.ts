export class ReporteLog {
  id?: number;
  idReporte!: string;
  reporteNombre!: string;
  reporteUsuario!: number;
  reporteUsuarioNombre!: string;
  reporteFecha?: Date;
  reporteDatos!: string;

  constructor(init?: Partial<ReporteLog>) {
    Object.assign(this, init);
  }
}