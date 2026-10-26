import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import {
  IonApp,
  IonSplitPane,
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonMenuToggle,
  IonItem,
  IonLabel,
  IonRouterOutlet,
  IonFooter,
  IonBadge
} from '@ionic/angular';

import { AuthService } from './core/services/auth.service';
import { AccessibilityService, FontScale } from './core/services/accessibility.service';

export interface AppMenuItem {
  title: string;
  url: string;
  icon: string;
  adminOnly?: boolean;
  badge?: string;
}

/**
 * Componente Raíz de la Aplicación (Shell)
 * Gestiona el menú lateral responsivo (Side Menu), el acceso por roles en el menú,
 * y los controles de accesibilidad universal WCAG 2.1 AA/AAA.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonApp,
    IonSplitPane,
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonMenuToggle,
    IonItem,
    IonLabel,
    IonRouterOutlet,
    IonFooter,
    IonBadge
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  public readonly authService = inject(AuthService);
  public readonly a11yService = inject(AccessibilityService);
  private readonly router = inject(Router);

  public readonly appPages: AppMenuItem[] = [
    { title: 'Cuadro de Mando (Dashboard)', url: '/dashboard', icon: '📊', adminOnly: true, badge: 'Admin' },
    { title: 'Plantilla de Empleados', url: '/employees', icon: '👥' },
    { title: 'Cartera de Clientes CRM', url: '/clients', icon: '💼' },
    { title: 'Auditoría NoSQL en Vivo', url: '/realtime-audit', icon: '⚡', badge: 'Live' },
    { title: 'Informes Oficiales (PDF/CSV)', url: '/reports', icon: '📄', adminOnly: true, badge: 'Admin' },
    { title: 'Manual de Usuario & Ayuda', url: '/help', icon: '❓' }
  ];

  isPageVisible(item: AppMenuItem): boolean {
    if (!this.authService.isAuthenticated()) {
      return item.url === '/help';
    }
    if (item.adminOnly) {
      return this.authService.isAdmin();
    }
    return true;
  }

  toggleHighContrast(): void {
    this.a11yService.toggleHighContrast();
  }

  changeFontScale(scale: FontScale): void {
    this.a11yService.setFontScale(scale);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
