import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { MainComponent } from './components/main/main.component';
import { CategoriaFormComponent } from './components/categoria-form/categoria-form.component';
import { ProductoFormComponent } from './components/producto-form/producto-form.component';
import { StockFormComponent } from './components/stock-form/stock-form.component';
import { EmpleadoFormComponent } from './components/empleado-form/empleado-form.component';
import { ContribuyenteFormComponent } from './components/contribuyente-form/contribuyente-form.component';
import { ProveedorFormComponent } from './components/proveedor-form/proveedor-form.component';

export const routes: Routes = [
    {
        path: '',
        component: LoginComponent
    },
    {
      path: 'main',
      component: MainComponent,
      children: [
        { path: 'categoria', component: CategoriaFormComponent },
        { path: 'producto', component: ProductoFormComponent },
        { path: 'stock', component: StockFormComponent },
        { path: 'empleado', component: EmpleadoFormComponent },
        { path: 'contribuyente', component: ContribuyenteFormComponent },
        { path: 'proveedor', component: ProveedorFormComponent },
      ]
    },
    { path: '', redirectTo: '/main', pathMatch: 'full' },
    { path: '**', redirectTo: '/main' }  // Cualquier ruta desconocida va a Main
];
