export class Log {
  id?: number;
  operador!: string;
  fecha?: Date;
  movimiento!: string;

  constructor(init?: Partial<Log>) {
    Object.assign(this, init);
  }
}