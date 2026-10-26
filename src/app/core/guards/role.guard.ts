import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard de Control de Acceso basado en Roles (RBAC)
 * Restringe vistas críticas (ej. Dashboard Ejecutivo, Informes Confidenciales)
 * exclusivamente al rol 'admin'. Si un usuario con rol 'user' intenta acceder,
 * se redirige a la vista accesible o /unauthorized.
 */
export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  const expectedRole = route.data?.['role'] as string | undefined;

  if (expectedRole && authService.userRole() !== expectedRole) {
    // Si se requiere rol admin pero el usuario es estándar, enviar a /unauthorized
    return router.createUrlTree(['/unauthorized'], {
      queryParams: { requiredRole: expectedRole }
    });
  }

  return true;
};
