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
import { PedidoFormComponent } from '../pedido-form/pedido-form.component';

@Component({
  selector: 'main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  imports: [CommonModule, MaterialModule]
})
export class MainComponent implements OnInit, OnDestroy {

  private customInjector: Injector | null = null;
  private navigationHistory: { component: any, data?: any, url: string }[] = [];
  selectedComponent: any = null;
  selectedComponentData: any = null;
  modoCustodia: boolean = false;
  modoAsignar: boolean = false;
  modoTransferir: boolean = false;
  modoQuitar: boolean = false;
  usuario: any = null;
  menuItems : Array<any> = [];
  isDevelopment : boolean = false;

  constructor(private router: Router, private authService: AuthService, private injector: Injector, private location: Location) {}

  ngOnInit(): void {

    this.isDevelopment = window.location.hostname === 'localhost' && window.location.port === '4200';
    const storedUser = localStorage.getItem('usuario');
    if (storedUser) {
      this.usuario = JSON.parse(storedUser);
      this.authService.initUnloadListener();
    }
    else{
      if (!this.isDevelopment) {
        this.router.navigate(['/'], { replaceUrl: true });
      }
    }
    window.addEventListener('popstate', this.handlePopState.bind(this));
    window.addEventListener('navegarComponente', this.navegarComponente.bind(this));

    const queryParams = new URLSearchParams(window.location.search);
    this.modoAsignar = queryParams.has('modo') && queryParams.get('modo') === 'asignar';
    this.modoTransferir = queryParams.has('modo') && queryParams.get('modo') === 'transferir';
    this.modoQuitar = queryParams.has('modo') && queryParams.get('modo') === 'quitar';
    this.modoCustodia = queryParams.has('modo') && queryParams.get('modo') === 'custodia';

    this.menuItems = [
      {
        label: 'Patrimonio',
        icon: 'business',
        position: 70,
        dependenciasPermitidas: ['Informatica'],
        subItems: [
          {
            label: 'Categorías',
            icon: 'view_list',
            ruta: 'categoria',
            component: CategoriaFormComponent,
            data: { empleadoLogueado: this.usuario }
          },
          {
            label: 'Productos',
            icon: 'category',
            ruta: 'producto',
            component: ProductoFormComponent,
            data: { empleadoLogueado: this.usuario }
          },
          {
            label: 'Stock',
            icon: 'inventory',
            ruta: 'stock',
            component: StockFormComponent,
            data: { empleadoLogueado: this.usuario }
          },
          {
            label: 'Custodia',
            icon: 'supervisor_account',
            ruta: 'empleado',
            component: EmpleadoFormComponent,
            data: { modoCustodia: true, empleadoLogueado: this.usuario }
          }
        ]
      },
      {
        label: 'Pedidos',
        icon: 'request_quote',
        position: 100,
        dependenciasPermitidas: ['Informatica'],
        subItems: [
          {
            label: 'Nuevo',
            icon: 'note_add',
            ruta: 'pedido',
            component: PedidoFormComponent,
            data: { modo: 'nuevo', empleadoLogueado: this.usuario }
          },
          {
            label: 'Listado',
            icon: 'list',
            ruta: 'pedido-listado',
            component: PedidoFormComponent,
            data: { modo: 'listado', empleadoLogueado: this.usuario }
          }
        ]
      },
      {
        label: 'RRHH',
        icon: 'groups',
        position: 130,
        dependenciasPermitidas: ['Informatica'],
        subItems: [
          {
            label: 'Empleados',
            icon: 'badge',
            ruta: 'empleado',
            component: EmpleadoFormComponent,
            data: { empleadoLogueado: this.usuario }
          },
          {
            label: 'Contribuyente',
            icon: 'account_balance',
            ruta: 'contribuyente',
            component: ContribuyenteFormComponent as any,
            data: { empleadoLogueado: this.usuario }
          }
        ]
      },
      {
        label: 'Proveedores',
        icon: 'local_shipping',
        position: 10,
        ruta: 'proveedor',
        component: ProveedorFormComponent,
        data: null,
        dependenciasPermitidas: ['Informatica']
      }
    ];
  }

  ngOnDestroy(): void {
    if (!this.isDevelopment) {
      this.authService.clean();
      window.removeEventListener('navegarComponente', this.navegarComponente.bind(this));
      console.log('El componente Main se destruyó');
    } 
  }

  handlePopState(event: PopStateEvent): void {
    // Remover el último del historial actual
    this.navigationHistory.pop();
  
    const lastEntry = this.navigationHistory[this.navigationHistory.length - 1];
  
    if (lastEntry) {
      this.selectedComponent = lastEntry.component;
      this.selectedComponentData = lastEntry.data || {};
  
      // ✅ Restaurar los modos en base al historial
      this.modoAsignar = this.selectedComponentData.modoAsignar ?? false;
      this.modoTransferir = this.selectedComponentData.modoTransferir ?? false;
      this.modoQuitar = this.selectedComponentData.modoQuitar ?? false;
      this.modoCustodia = this.selectedComponentData.modoCustodia ?? false;
  
      // ✅ Actualizar el injector
      this.customInjector = Injector.create({
        providers: [
          { provide: 'menuData', useValue: this.selectedComponentData }
        ],
        parent: this.injector
      });
  
    } else {
      //console.warn("No hay más historial. Evitando volver al login.");
      //this.location.replaceState('/main');
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
      this.customInjector = null;

      const found = this.menuItems
        .flatMap(item => item.subItems || [item])
        .find(i => i.component === component);

      let url = '/main';
      if (found?.ruta) {
        url += '/' + found.ruta;
      }

      if (data) {
        const params = [];
        if (data.modoAsignar) params.push('modo=asignar');
        if (data.modoTransferir) params.push('modo=transferir');
        if (data.modoQuitar) params.push('modo=quitar');
        if (data.modoCustodia) params.push('modo=custodia');
        if (params.length > 0) {
          url += '?' + params.join('&');
        }
      }

      this.navigationHistory.push({ component, data, url });
      history.pushState({}, '', url);
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
