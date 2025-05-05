import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MaterialModule } from '../../modules/material/material.module';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'confirm-table-dialog',
  templateUrl: './confirm-table-dialog.component.html',
  styleUrls: ['./confirm-table-dialog.component.scss'],
  imports: [MaterialModule, CommonModule]
})
export class ConfirmTableDialogComponent implements OnInit {
  dataSource!: MatTableDataSource<any>;
  displayedColumns!: string[];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    public dialogRef: MatDialogRef<ConfirmTableDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      message: string;
      columns: string[];
      columnNames?: { [key: string]: string };
      rows: any[];
    }
  ) {}

  ngOnInit(): void {
    this.displayedColumns = this.data.columns;
    this.dataSource = new MatTableDataSource(this.data.rows);
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  confirm(): void {
    this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = filterValue;
  }
}
