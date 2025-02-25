import { Component } from '@angular/core';
import { MaterialModule } from '../../modules/material/material.module';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  imports: [CommonModule, MaterialModule], 
})
export class MainComponent {
  selectedComponent: any = null;

  menuItems = [
    {
      label: 'Patrimonio',
      icon: 'business',
      subItems: [
        { label: 'Stock', icon: 'inventory', component: '' },
        { label: 'Categorías', icon: 'category', component: '' },
        { label: 'Marcas', icon: 'branding_watermark', component: '' },
      ],
    },
  ];

  selectComponent(component: any): void {
    this.selectedComponent = component;
  }
}
