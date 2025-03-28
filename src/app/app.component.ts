import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ErrorHandlerService } from './services/error-handler/error-handler.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit{

  title = 'mcpd-front';
  showOverlay = false;
  errorMessage: string | null = null;

  constructor(private errorHandler: ErrorHandlerService) {}

  ngOnInit(): void {
    this.errorHandler.error$.subscribe(message => {
      if (message) {
        this.showOverlay = true;
        this.errorMessage = message;
        console.error(this.errorMessage);
      } else {
        this.showOverlay = false;
      }
    });
  }

  closeOverlay() {
    this.showOverlay = false;
    this.errorHandler.clearError();
  }
}
