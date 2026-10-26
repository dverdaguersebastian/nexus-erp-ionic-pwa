import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

/**
 * Enrutamiento Global de la Aplicación (Lazy Loading Completo)
 * Protegido mediante Guards declarativos para control de autenticación y roles RBAC (RA 1)
 */
export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage),
    title: 'Iniciar Sesión | NexusERP Pro'
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.page').then(m => m.RegisterPage),
    title: 'Alta de Usuario | NexusERP Pro'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.page').then(m => m.DashboardPage),
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' },
    title: 'Cuadro de Mando Ejecutivo | NexusERP Pro'
  },
  {
    path: 'employees',
    loadComponent: () => import('./pages/employees/employees.page').then(m => m.EmployeesPage),
    canActivate: [authGuard],
    title: 'Directorio de Empleados | NexusERP Pro'
  },
  {
    path: 'clients',
    loadComponent: () => import('./pages/clients/clients.page').then(m => m.ClientsPage),
    canActivate: [authGuard],
    title: 'Cartera de Clientes CRM | NexusERP Pro'
  },
  {
    path: 'realtime-audit',
    loadComponent: () => import('./pages/realtime-audit/realtime-audit.page').then(m => m.RealtimeAuditPage),
    canActivate: [authGuard],
    title: 'Auditoría NoSQL en Tiempo Real | NexusERP Pro'
  },
  {
    path: 'reports',
    loadComponent: () => import('./pages/reports/reports.page').then(m => m.ReportsPage),
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' },
    title: 'Centro de Informes PDF/CSV | NexusERP Pro'
  },
  {
    path: 'help',
    loadComponent: () => import('./pages/help/help.page').then(m => m.HelpPage),
    title: 'Manual de Usuario & Ayuda | NexusERP Pro'
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./pages/unauthorized/unauthorized.page').then(m => m.UnauthorizedPage),
    title: 'Acceso Denegado 403 | NexusERP Pro'
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
