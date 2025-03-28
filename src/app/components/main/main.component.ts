import { Component, OnDestroy, OnInit } from '@angular/core';
import { MaterialModule } from '../../modules/material/material.module';
import { CommonModule } from '@angular/common';
import { ProductoFormComponent } from '../producto-form/producto-form.component';
import { CategoriaFormComponent } from '../categoria-form/categoria-form.component';
import { StockFormComponent } from '../stock-form/stock-form.component';
import { Router } from '@angular/router';
import { AuthService } from '../../services/rest/auth/auth.service';
import { ContribuyenteFormComponent } from '../contribuyente-form/contribuyente-form.component';
import { EmpleadoFormComponent } from '../empleado-form/empleado-form.component';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  imports: [CommonModule, MaterialModule]
})
export class MainComponent implements OnInit, OnDestroy {
  selectedComponent: any = null;

  menuItems = [
    {
      label: 'Patrimonio',
      icon: 'business',
      position: 70,
      subItems: [
        { label: 'Categorías', icon: 'view_list', component: CategoriaFormComponent },
        { label: 'Productos', icon: 'category', component: ProductoFormComponent },
        { label: 'Stock', icon: 'inventory', component: StockFormComponent }
      ],
    },
    {
      label: 'RRHH',
      icon: 'groups',
      position: 130,
      subItems: [
        { label: 'Empleados', icon: 'badge', component: EmpleadoFormComponent }, 
        { label: 'Contribuyente', icon: 'account_balance', component: ContribuyenteFormComponent as any }
      ],
    }
  ];

  usuario: any = null;

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    const storedUser = localStorage.getItem('usuario');
    if (storedUser) {
      this.usuario = JSON.parse(storedUser);
    }
  }

  ngOnDestroy(): void {
    //this.authService.clean();
    console.log('El componente Main se destruyó');
  }

  selectComponent(component: any): void {
    this.selectedComponent = component;
  }

  logout(): void {
    this.authService.logout();
  }

  setMenuTop(newTop: number) {
    document.documentElement.style.setProperty('--menu-top', `${newTop}px`);
  }
}
