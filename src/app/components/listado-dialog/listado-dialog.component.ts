import { AfterViewInit, Component, Inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MaterialModule } from '../../modules/material/material.module';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'listado-dialog',
  templateUrl: './listado-dialog.component.html',
  styleUrls: ['./listado-dialog.component.scss'],
  imports: [CommonModule, MaterialModule, ReactiveFormsModule, FormsModule, MatPaginatorModule]
})
export class ListadoDialogComponent implements AfterViewInit{

  dataSource: MatTableDataSource<any>;
  activeFilters: { [key: string]: string } = {};
  finalColumns: string[] = []; 
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  constructor(
    public dialogRef: MatDialogRef<ListadoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      title: string;
      columns: string[];
      columnNames?: { [key: string]: string };
      dataSource?: MatTableDataSource<any>;
      rows: any[];
      filterableColumns?: string[];
      onRemove?: (row: any) => void; // 👈 callback opcional
  }) 
  
  {
    this.dataSource = data.dataSource || new MatTableDataSource(data.rows || []);
    this.finalColumns = [
      ...this.data.columns,
      ...(this.data.onRemove ? ['acciones'] : [])
    ];
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  close(): void {
    this.dialogRef.close();
  }

  formatValue(row: any, column: string): any {
    let value = column.split('.').reduce((acc, key) => acc?.[key], row);
  
    if (column === 'empleadoCustodia') {
      return value ?? '-';
    }
  
    if (column === 'fecha' && value) {
      const date = new Date(value);
      return date.toLocaleString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  
    return value ?? '';
  }

  applyFilter(column: string, event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.activeFilters[column] = filterValue;
  
    this.dataSource.filterPredicate = (data, filter) => {
      const activeFilters = JSON.parse(filter);
  
      if (activeFilters.all) {
        const searchWords: string[] = activeFilters.all.split(' ').filter((w: string) => w);
        return searchWords.every((word: string) => {
          return this.data.columns.some((col: string) => {
            const dataValue = (data[col] ?? '').toString().toLowerCase();
            return dataValue.includes(word);
          });
        });
      } else {
        return Object.keys(activeFilters).every((col: string) => {
          const dataValue = (data[col] ?? '').toString().toLowerCase();
          return dataValue.includes(activeFilters[col]);
        });
      }
    };
  
    this.dataSource.filter = JSON.stringify(this.activeFilters);
  }
}