# Anexo de Seguridad: Arquitectura Reactiva de Navegación, Intercepción HTTP y RBAC (NexusERP Pro)

**Módulo Profesional:** Desarrollo de Interfaces (Código: 0488)  
**Ciclo Formativo:** Grado Superior en Desarrollo de Aplicaciones Multiplataforma (DAM 2)  
**Centro:** Universidad Nebrija  
**Alumno:** Diego Verdaguer Sebastián  
**Proyecto:** NexusERP Pro — Sistema de Gestión Multiplataforma (PWA/Híbrida)  
**Entorno Tecnológico:** Ionic Framework 9 / Angular 22 (Standalone Components, Signals & RxJS)  
**Repositorio Oficial:** [https://github.com/dverdaguersebastian/nexus-erp-ionic-pwa](https://github.com/dverdaguersebastian/nexus-erp-ionic-pwa)  

---

## Apartado A: Fundamentación Teórico-Técnica

### 1. Functional Guards en Angular / Ionic Standalone

#### Ciclo de Vida en el Enrutamiento y Tipos de Guards
En la arquitectura moderna de Angular e Ionic basada en componentes *Standalone*, el enrutador prescinde de las antiguas clases basadas en interfaces deprecadas (`CanActivate`, `CanLoad`) e implementa **Guards Funcionales** (`CanMatchFn`, `CanActivateFn`, `CanDeactivateFn`) que utilizan inyección funcional directa mediante `inject()`.

El ciclo de resolución de navegación reactiva sigue una secuencia determinista en el pipeline del Router:

```
[NavigationStart]
       │
       ▼
[1. canMatch] (Evaluación previa al emparejamiento de ruta y descarga de chunks JS)
       │─── Si devuelve false / UrlTree ──► Cancela descarga del bundle o redirige (/unauthorized)
       ▼ (Si devuelve true)
[2. Descarga de Lazy Chunks JS / CSS (loadComponent)]
       │
       ▼
[3. canActivateChild / canActivate] (Verificación de sesión y permisos previa al montaje)
       │─── Si devuelve false / UrlTree ──► Bloqueo y redirección (/login?returnUrl=... o /unauthorized)
       ▼ (Si devuelve true)
[4. Instanciación y Renderizado del Componente Ionic]
       │
       ▼
[5. canDeactivate] (Validación al abandonar la vista para proteger formularios sin guardar)
       │
       ▼
[NavigationEnd]
```

#### Impacto en Rendimiento y Lazy Loading: `canActivate` frente a `canMatch`

| Dimensión Técnica | `canActivate` (`CanActivateFn`) | `canMatch` (`CanMatchFn`) |
| :--- | :--- | :--- |
| **Punto de Ejecución** | Posterior al emparejamiento de URL y descarga del chunk perezoso. | Previo a cualquier petición de red para descargar el paquete JavaScript de la vista. |
| **Impacto en Red (Payload)** | **Menos eficiente en rutas restringidas:** Descarga el chunk `.js` aunque el guard deniegue finalmente la activación. | **Óptimo:** Si la validación de rol falla, el navegador no descarga el código de la vista administrativa. |
| **Seguridad en Cliente** | El bundle descargado puede inspeccionarse en la pestaña *Sources* de DevTools. | **Seguridad por Diseño:** El código fuente de vistas ejecutivas nunca viaja al cliente sin privilegios. |
| **Resolución de Rutas** | Detiene la navegación o redirige mediante `UrlTree` (`/login` o `/unauthorized`). | Permite tanto redirección por `UrlTree` como fallback a otra ruta con el mismo `path` según el rol. |

---

### 2. HTTP Interceptors Funcionales (`HttpInterceptorFn`)

#### Pipeline Funcional e Inmutabilidad de Peticiones
El tráfico HTTP en Angular Standalone se procesa a través de una cadena de funciones puras de tipo:

```typescript
type HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => Observable<HttpEvent<unknown>>;
```

Por especificación de seguridad (*deep immutability*), las instancias de `HttpRequest` son inmutables. Para adjuntar el token criptográfico de sesión o cabeceras de trazabilidad corporativa, el interceptor clona la petición original mediante `req.clone({ setHeaders: ... })` antes de invocar `next(clonedReq)`.

#### Gestión Centralizada de Errores 401 (No Autorizado) vs 403 (Prohibido)
* **HTTP 401 Unauthorized:** Indica ausencia de credenciales válidas o expiración del token JWT (`exp < Date.now()`). El interceptor `authInterceptor` captura la excepción con `catchError`, ejecuta `authService.logout()` para limpiar de forma atómica el almacenamiento seguro y redirige a `/login`.
* **HTTP 403 Forbidden:** La identidad del usuario está autenticada válidamente, pero su rol carece de autorización para ejecutar la operación solicitada. El interceptor conserva la sesión activa pero redirige inmediatamente a `/unauthorized` (Vista 403).

---

### 3. Control de Acceso Basado en Roles (RBAC) y Gestión Reactiva con Signals

El modelo **RBAC (*Role-Based Access Control*)** formaliza el principio de mínimo privilegio desacoplando al sujeto de los permisos individuales mediante la relación:

$$\text{Usuario (Sujeto)} \longrightarrow \text{Rol Corporativo (\texttt{admin} | \texttt{user})} \longrightarrow \text{Permisos sobre Vistas y Acciones CRUD}$$

* **Autenticación (AuthN):** Verificación de identidad (`AuthService.login()`) y emisión de un JSON Web Token (JWT) estructurado (`header.payload.signature`) con los claims `sub`, `email`, `role`, `name`, `iat` y `exp`.
* **Autorización (AuthZ):** Evaluación reactiva síncrona de privilegios mediante **Angular Signals** (`currentUser`, `isAuthenticated`, `userRole`, `isAdmin`), evitando suscripciones manuales y fugas de memoria (*memory leaks*).

---

## Apartado B: Justificación de Implementación en NexusERP Pro

### 1. Jerarquía de Roles y Matriz de Acceso en el Árbol de Rutas

En **NexusERP Pro** se implementan los dos perfiles exigidos en las especificaciones oficiales del proyecto:

| Rol del Sistema | Credencial de Prueba | Vistas Permitidas (`200 OK`) | Vistas Restringidas (`403 /unauthorized`) | Capacidades Operativas |
| :--- | :--- | :--- | :--- | :--- |
| **Administrador (`admin`)** | `admin@empresa.com` / `admin123` | `/dashboard`, `/employees`, `/clients`, `/realtime-audit`, `/reports`, `/help` | Ninguna (Acceso total) | Cuadro de mando Chart.js, alta y baja de empleados, auditoría NoSQL y exportación de informes PDF/CSV. |
| **Usuario Estándar (`user`)** | `empleado@empresa.com` / `user123` | `/employees`, `/clients`, `/realtime-audit`, `/help` | `/dashboard`, `/reports` | Consulta de directorio de empleados (solo lectura, sin botón de borrado), gestión operativa CRM y manual de ayuda. |

### 2. Implementación Real en el Código Fuente del Proyecto

#### Configuración Declarativa de Rutas con Lazy Loading y Guards (`src/app/app.routes.ts`)
```typescript
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
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
  { path: '**', redirectTo: 'dashboard' }
];
```

#### Guards Funcionales (`src/app/core/guards/auth.guard.ts` y `role.guard.ts`)
```typescript
// src/app/core/guards/auth.guard.ts
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

// src/app/core/guards/role.guard.ts
export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  const expectedRole = route.data?.['role'] as string | undefined;
  if (expectedRole && authService.userRole() !== expectedRole) {
    return router.createUrlTree(['/unauthorized'], {
      queryParams: { requiredRole: expectedRole }
    });
  }
  return true;
};
```

#### Interceptor HTTP Funcional (`src/app/core/interceptors/auth.interceptor.ts`)
```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getRawToken();

  let clonedReq = req;
  if (token) {
    clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        'X-Client-App': 'NexusERP-PWA/1.0.0'
      }
    });
  }

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();
        router.navigate(['/login']);
      } else if (error.status === 403) {
        router.navigate(['/unauthorized']);
      }
      return throwError(() => error);
    })
  );
};
```

#### Control Visual Condicional en Interfaz (UI/UX Reactiva con Signals)
Además del bloqueo en el enrutador, la interfaz adapta dinámicamente las opciones del menú lateral (`app.component.ts`) y las acciones de las tablas (`employees.page.ts`) consumiendo el Signal computado `authService.isAdmin()`:
* Los ítems de menú con `adminOnly: true` (**Cuadro de Mando** e **Informes Oficiales**) muestran un distintivo `ADMIN` o se filtran según el perfil activo.
* En la tabla agnóstica `AdvancedDataTableComponent`, la acción destructiva **"Dar de Baja"** se deshabilita u oculta para el rol `user`, impidiendo operaciones no autorizadas desde la capa de presentación.

---

## Apartado C: Matriz de Alternativas Evaluadas

| Dimensión Técnica | Opción A (Implementada en NexusERP Pro):<br/>**Arquitectura Reactiva Standalone** | Opción B:<br/>**Enfoque Imperativo en Componentes** | Opción C:<br/>**Enfoque Sobredimensionado** |
| :--- | :--- | :--- | :--- |
| **Control de Navegación** | **Guards Funcionales (`authGuard` / `roleGuard`)**<br/>• *Seguridad:* Corte previo a la inicialización de la vista.<br/>• *Mantenibilidad:* Declarativo en `app.routes.ts`.<br/>• *Escalabilidad:* Muy alta. | **Verificación en `ngOnInit` / `ionViewWillEnter`**<br/>• *Seguridad:* Deficiente (parpadeo FOUC de datos sensibles).<br/>• *Mantenibilidad:* Baja (lógica duplicada en cada página). | **Servidor de Rutas Dinámicas SSR**<br/>• *Seguridad:* Alta.<br/>• *Sobrecarga:* Latencia adicional e incompatible con modo PWA offline. |
| **Inyección de Tokens HTTP** | **Interceptor Funcional (`authInterceptor`)**<br/>• *Seguridad:* Garantiza cabecera `Bearer` en el 100% de llamadas.<br/>• *Mantenibilidad:* Punto único de control 401/403 (DRY). | **Cabeceras Manuales en cada Servicio**<br/>• *Seguridad:* Crítica (riesgo humano de omisión).<br/>• *Mantenibilidad:* Inviable al escalar endpoints. | **Gateway Proxy Externo Dedicado**<br/>• *Seguridad:* Alta.<br/>• *Mantenibilidad:* Complejidad innecesaria en cliente PWA. |
| **Gestión de Estado RBAC** | **Angular Signals (`computed`) + JWT Claims**<br/>• *Rendimiento:* Reactividad fina sin `Zone.js` overhead.<br/>• *Seguridad:* Verificación automática de expiración `exp`. | **Flags Booleanos Globales Mutables**<br/>• *Seguridad:* Vulnerable a mutaciones accidentales.<br/>• *Escalabilidad:* Nula ante nuevos roles. | **Store NgRx + Motor ABAC Completo**<br/>• *Rendimiento:* Elevado boilerplate para dos roles definidos (`admin` / `user`). |
