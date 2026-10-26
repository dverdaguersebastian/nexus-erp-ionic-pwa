import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import {
  IonContent,
  IonSpinner
} from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';

/**
 * Página de Autenticación / Inicio de Sesión
 * Implementa Reactive Forms declarativos, data-binding bidireccional controlado,
 * gestión visual de errores y atajos para evaluación de credenciales.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    IonContent,
    IonSpinner
  ],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  public readonly isLoading = signal<boolean>(false);
  public readonly errorMessage = signal<string | null>(null);

  public readonly loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  // Atajos para el evaluador / docente
  fillCredentials(role: 'admin' | 'user'): void {
    if (role === 'admin') {
      this.loginForm.patchValue({
        email: 'admin@empresa.com',
        password: 'admin123'
      });
    } else {
      this.loginForm.patchValue({
        email: 'empleado@empresa.com',
        password: 'user123'
      });
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.loginForm.value).subscribe({
      next: (user) => {
        this.isLoading.set(false);
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || (user.role === 'admin' ? '/dashboard' : '/employees');
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.message || 'Error al iniciar sesión');
      }
    });
  }
}
