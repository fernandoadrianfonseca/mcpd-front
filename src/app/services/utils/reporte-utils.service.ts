import { Injectable } from '@angular/core';
import { ReporteService } from '../rest/reporte/reporte.service';
import { StockParaOperar } from '../../components/stock-form/stock-form.component';


@Injectable({
  providedIn: 'root'
})
export class ReporteUtilsService {

  constructor(private reporteService: ReporteService) {}

  generarReporteAsignacion(
    stockAsignado: StockParaOperar[],
    nombreReporte: string,
    datosExtra: {
      generaReporteLegajo: number;
      generaReporteNombre: string;
      legajoEmpleado: number;
      nombreEmpleado: string;
      legajoEmpleadoEntrega: number;
      nombreEmpleadoEntrega: string;
      legajoEmpleadoRecibe: number;
      nombreEmpleadoRecibe: string;
      dependenciaAutoriza: string;
      fechaDevolucion?: Date | null;
      cantidadCopias?: number;
    }
  ): void {
    const datos = stockAsignado.map(item => ({
      cantidad: item.cantidad,
      descripcion: [item.stock.productoNombre, item.stock.marca, item.stock.detalle]
                    .filter(part => part?.trim?.()).join(' '),
      oc: '0',
      remito: '0'
    }));

    const parametros: any = {
      nombreEmpleado: datosExtra.nombreEmpleado,
      legajoEmpleado: String(datosExtra.legajoEmpleado),
      nombreEmpleadoEntrega: datosExtra.nombreEmpleadoEntrega,
      legajoEmpleadoEntrega: String(datosExtra.legajoEmpleadoEntrega),
      nombreEmpleadoRecibe: datosExtra.nombreEmpleadoRecibe,
      legajoEmpleadoRecibe: String(datosExtra.legajoEmpleadoRecibe),
      dependenciaAutoriza: datosExtra.dependenciaAutoriza
    };

    if (nombreReporte === 'acta-alta-patrimonial-confecha' && datosExtra.fechaDevolucion) {
      parametros.fechaDevolucion = datosExtra.fechaDevolucion;
    }

    const requestDto = {
      nombreReporte,
      generaReporteLegajo: datosExtra.generaReporteLegajo,
      generaReporteNombre: datosExtra.generaReporteNombre,
      cantidadCopias: datosExtra.cantidadCopias || 1,
      parametros,
      datos
    };

    this.reporteService.generarReporteConLista(requestDto).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      //window.open(url);

      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, '-')
        .replace('T', '_')
        .replace('Z', '');  

      //download
      const a = document.createElement('a');
      a.href = url;
      a.download = `${requestDto.nombreReporte}_${timestamp}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }
}
