import { Component } from '@angular/core';
import { MaterialModule } from '../../modules/material/material.module';
import { CommonModule } from '@angular/common';
import { ProductoFormComponent } from '../producto-form/producto-form.component';
import { CategoriaFormComponent } from '../categoria-form/categoria-form.component';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  imports: [CommonModule, MaterialModule]
})
export class MainComponent {
  selectedComponent: any = null;

  menuItems = [
    {
      label: 'Patrimonio',
      icon: 'business',
      subItems: [
        { label: 'Categorías', icon: 'view_list', component: CategoriaFormComponent },
        { label: 'Productos', icon: 'category', component: ProductoFormComponent },
        { label: 'Stock', icon: 'inventory', component: '' }
      ],
    },
  ];

  selectComponent(component: any): void {
    this.selectedComponent = component;
  }
}
