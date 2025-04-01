import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common'; 
import { AuthService } from '../../services/rest/auth/auth.service';
import { Usuario } from '../../models/usuario.model';
import { MaterialModule } from '../../modules/material/material.module';
import { CambiarPasswordDialogComponent } from '../cambiar-password-dialog/cambiar-password-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [MaterialModule, ReactiveFormsModule, CommonModule]
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = '';

  constructor(private fb: FormBuilder,
                private authService: AuthService,
                  private router: Router,
                    private dialog: MatDialog) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const { username, password } = this.loginForm.value;

      this.authService.login(username, password).subscribe({
        next: (usuario: Usuario) => {
          console.log('Autenticado:', usuario);
          this.authService.saveLogin(usuario);
          this.router.navigate(['/main']);
        },
        error: (err) => {
          console.error('Error de login:', err);
          const errorMsg = err.message;
          if (errorMsg.includes('ESE LEGAJO NO EXISTE O NO SE ENCUENTRA HABILITADO. CONSULTE CON INFORMÁTICA')) {
            this.errorMessage = 'Legajo Inexistente';
          } else if (errorMsg.includes('DEBE RENOVAR SUS DATOS DE ACCESO')) {
            const dialogRef = this.dialog.open(CambiarPasswordDialogComponent, {
              width: '400px',
              disableClose: true,
              data: username
            });
          
            dialogRef.afterClosed().subscribe(nuevaPassword => {
              if (nuevaPassword) {
                this.authService.modificarPassword(username, nuevaPassword).subscribe(() => {
                  this.errorMessage = '';
                  this.authService.showSuccessMessage('Contraseña actualizada con éxito. Intente ingresar nuevamente.', 5);
                });
              }
            });
          } else if (errorMsg.includes('DATOS INCORRECTOS')) {
            this.errorMessage = 'Credenciales Inválidas';
          } else {
            this.errorMessage = errorMsg;
          }
        }
      });
    }
  }
}
