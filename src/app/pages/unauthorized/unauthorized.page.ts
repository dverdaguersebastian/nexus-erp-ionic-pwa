import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonMenuButton
} from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';

/**
 * Vista de Acceso Denegado (403 Forbidden)
 * Maneja caídas del roleGuard cuando un usuario estándar intenta forzar una ruta de Administrador.
 */
@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonMenuButton
  ],
  templateUrl: './unauthorized.page.html',
  styleUrls: ['./unauthorized.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UnauthorizedPage {
  public readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  logoutAndSwitch(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
