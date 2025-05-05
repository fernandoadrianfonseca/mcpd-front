import { Component, Injector, OnDestroy, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { MaterialModule } from '../../modules/material/material.module';
import { CommonModule } from '@angular/common';
import { ProductoFormComponent } from '../producto-form/producto-form.component';
import { CategoriaFormComponent } from '../categoria-form/categoria-form.component';
import { StockFormComponent } from '../stock-form/stock-form.component';
import { Router } from '@angular/router';
import { AuthService } from '../../services/rest/auth/auth.service';
import { ContribuyenteFormComponent } from '../contribuyente-form/contribuyente-form.component';
import { EmpleadoFormComponent } from '../empleado-form/empleado-form.component';
import { ProveedorFormComponent } from '../proveedor-form/proveedor-form.component';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  imports: [CommonModule, MaterialModule]
})
export class MainComponent implements OnInit, OnDestroy {

  private customInjector: Injector | null = null;
  private navigationHistory: { component: any, data?: any, url: string }[] = [];
  selectedComponent: any = null;
  selectedComponentData: any = null;
  usuario: any = null;
  menuItems : Array<any> = [];

  constructor(private router: Router, private authService: AuthService, private injector: Injector, private location: Location) {}

  ngOnInit(): void {
    const storedUser = localStorage.getItem('usuario');
    if (storedUser) {
      this.usuario = JSON.parse(storedUser);
      this.authService.initUnloadListener();
    }
    else{
      this.router.navigate(['/'], { replaceUrl: true });
    }
    window.addEventListener('popstate', this.handlePopState.bind(this));
    window.addEventListener('navegarComponente', this.navegarComponente.bind(this));
    this.menuItems = [
      {
        label: 'Patrimonio',
        icon: 'business',
        position: 70,
        dependenciasPermitidas: ['Informatica'],
        subItems: [
          { label: 'Categorías', icon: 'view_list', component: CategoriaFormComponent, data:null },
          { label: 'Productos', icon: 'category', component: ProductoFormComponent, data:null },
          { label: 'Stock', icon: 'inventory', component: StockFormComponent, data: {empleadoLogueado: this.usuario} },
          { label: 'Custodia', icon: 'supervisor_account', component: EmpleadoFormComponent, data: { modoCustodia: true } }
        ],
      },
      {
        label: 'RRHH',
        icon: 'groups',
        position: 130,
        dependenciasPermitidas: ['Informatica'],
        subItems: [
          { label: 'Empleados', icon: 'badge', component: EmpleadoFormComponent, data:null }, 
          { label: 'Contribuyente', icon: 'account_balance', component: ContribuyenteFormComponent as any, data:null }
        ],
      },
      {
        label: 'Proveedores',
        icon: 'local_shipping',
        position: 10,
        component: ProveedorFormComponent,
        data:null,
        dependenciasPermitidas: ['Informatica']
      }
    ];
  }

  ngOnDestroy(): void {
    this.authService.clean();
    window.removeEventListener('navegarComponente', this.navegarComponente.bind(this));
    console.log('El componente Main se destruyó');
  }

  handlePopState(event: PopStateEvent): void {
    // Remover el último del historial actual
    this.navigationHistory.pop();
  
    const lastEntry = this.navigationHistory[this.navigationHistory.length - 1];
  
    if (lastEntry) {
      this.selectedComponent = lastEntry.component;
      this.selectedComponentData = lastEntry.data || {};
    } else {
      // Evita volver al login si no hay más historial
      history.pushState({}, '', '/main');
    }
  }

  navegarComponente(event: Event): void {
    const customEvent = event as CustomEvent<any>;
    const { componente, data } = customEvent.detail;
  
    if (componente) {
      this.selectComponent(componente, data);
    } else {
      console.warn('No se proporcionó componente en navegarComponente');
    }
  }

  createInjector(): Injector {
    if (!this.customInjector) {
      this.customInjector = Injector.create({
        providers: [
          { provide: 'menuData', useValue: this.selectedComponentData }
        ],
        parent: this.injector
      });
    }
    return this.customInjector;
  }

  selectComponent(component: any, data?: any): void {
    this.selectedComponent = component;
    this.selectedComponentData = data || {};
    this.customInjector = null; // reset cache para que el próximo render tenga el nuevo injector
    const label = component.name?.toLowerCase().replace(/component|form|_/g, '') || 'componente';
    const url = `/main/${label}`;
    this.navigationHistory.push({ component, data, url });
    history.pushState({}, '', url);
    //this.location.replaceState(`/main/${label}`);
    //this.location.go(`/main/${label}`);
  }

  logout(): void {
    this.authService.logout();
  }

  setMenuTop(newTop: number) {
    document.documentElement.style.setProperty('--menu-top', `${newTop}px`);
  }

  canView(item: any): boolean {
    if (!item.dependenciasPermitidas || item.dependenciasPermitidas.length === 0) return true;
    return item.dependenciasPermitidas.includes(this.usuario?.dependencia);
  }
}
