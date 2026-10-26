import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  AsyncValidatorFn,
  ValidationErrors
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  IonContent,
  IonSpinner
} from '@ionic/angular';
import { Observable, timer } from 'rxjs';
import { map, switchMap, first } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';

/**
 * Validador Asíncrono de Disponibilidad de Correo Electrónico
 * Consulta el servicio backend simulado con debounce reactivo
 */
export function uniqueEmailValidator(authService: AuthService): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value) {
      return new Observable(sub => { sub.next(null); sub.complete(); });
    }
    // Debounce de 350ms mediante timer para no saturar peticiones
    return timer(350).pipe(
      switchMap(() => authService.checkEmailAvailability(control.value)),
      map(isAvailable => (isAvailable ? null : { emailTaken: true })),
      first()
    );
  };
}

/**
 * Validador Asíncrono de Disponibilidad de Código de Empleado
 */
export function uniqueEmployeeCodeValidator(authService: AuthService): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value) {
      return new Observable(sub => { sub.next(null); sub.complete(); });
    }
    return timer(350).pipe(
      switchMap(() => authService.checkEmployeeCodeAvailability(control.value)),
      map(isAvailable => (isAvailable ? null : { codeTaken: true })),
      first()
    );
  };
}

/**
 * Página de Registro y Alta con Validaciones Asíncronas Reactivas
 * Implementa RA 1 y RA 2 con gestión avanzada de UX de estados PENDING / VALID / INVALID
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    IonContent,
    IonSpinner
  ],
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  public readonly isSubmitting = signal<boolean>(false);
  public readonly submitError = signal<string | null>(null);
  public readonly submitSuccess = signal<boolean>(false);

  public readonly registerForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: [
      '',
      [Validators.required, Validators.email],
      [uniqueEmailValidator(this.authService)]
    ],
    employeeCode: [
      '',
      [Validators.required, Validators.pattern(/^EMP-\d{3}$/)],
      [uniqueEmployeeCodeValidator(this.authService)]
    ],
    department: ['Ingeniería de Software & Cloud', [Validators.required]],
    role: ['user', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set(null);

    this.authService.register(this.registerForm.value).subscribe({
      next: (user) => {
        this.isSubmitting.set(false);
        this.submitSuccess.set(true);
        setTimeout(() => {
          this.router.navigate(['/employees']);
        }, 1500);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.submitError.set(err.message || 'Error durante el registro');
      }
    });
  }

  // Comprobadores de estado de validación asíncrona para la plantilla
  get isEmailPending(): boolean {
    return this.registerForm.get('email')?.status === 'PENDING';
  }

  get isEmailValid(): boolean {
    const c = this.registerForm.get('email');
    return !!c && c.status === 'VALID' && c.touched && !!c.value;
  }

  get isCodePending(): boolean {
    return this.registerForm.get('employeeCode')?.status === 'PENDING';
  }

  get isCodeValid(): boolean {
    const c = this.registerForm.get('employeeCode');
    return !!c && c.status === 'VALID' && c.touched && !!c.value;
  }
}
