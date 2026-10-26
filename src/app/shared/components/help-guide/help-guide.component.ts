import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface HelpTopic {
  id: string;
  category: string;
  title: string;
  summary: string;
  content: string;
  badge: string;
}

/**
 * Componente Reutilizable de Ayuda y Manual de Usuario Contextual
 * Proporciona documentación interactiva integrada en tiempo de ejecución (RA 6).
 */
@Component({
  selector: 'app-help-guide',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './help-guide.component.html',
  styleUrls: ['./help-guide.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HelpGuideComponent {
  public readonly selectedTopicId = signal<string>('auth-roles');
  public readonly filterQuery = signal<string>('');

  public readonly topics: HelpTopic[] = [
    {
      id: 'auth-roles',
      category: 'Seguridad y Acceso',
      title: 'Sistema de Autenticación y Control por Roles (RBAC)',
      summary: 'Diferenciación entre Administrador y Usuario Estándar con protección de rutas.',
      content: `La aplicación cuenta con dos perfiles reglamentarios:
1. **Administrador** (<code>admin@empresa.com</code> / <code>admin123</code>): Acceso irrestricto al Cuadro de Mando Ejecutivo (Chart.js), inserción y borrado de empleados, auditoría NoSQL completa y exportación de informes confidenciales.
2. **Usuario Estándar** (<code>empleado@empresa.com</code> / <code>user123</code>): Acceso a la consulta de nóminas propias, cartera de clientes y canal de soporte. Cualquier intento de acceder a rutas de administración es interceptado por <code>roleGuard</code> redirigiendo a la pantalla <code>/unauthorized</code>.`,
      badge: 'Fase 1 (RA 1)'
    },
    {
      id: 'reactive-forms',
      category: 'Formularios Declarativos',
      title: 'Validaciones Asíncronas y Data Binding',
      summary: 'Verificación en tiempo real de correos y códigos contra el servicio backend.',
      content: `Los formularios de alta y registro aplican <code>ReactiveFormsModule</code> con validadores asíncronos:
- Verificación de duplicidad de correo mediante <code>checkEmailAvailability()</code> con retardo controlado y debounce.
- Feedback visual instantáneo: Estados 'Comprobando...', 'Disponible' o 'Correo en uso'.
- Enlace bidireccional controlado sin mutaciones directas del DOM.`,
      badge: 'Fase 1 (RA 2)'
    },
    {
      id: 'dual-data-sources',
      category: 'Persistencia de Datos',
      title: 'Consumo Dual: SQL Relacional y NoSQL Tiempo Real',
      summary: 'Orquestación asíncrona de endpoints REST y streams documentales de Firestore.',
      content: `La arquitectura integra dos motores de datos simulados:
- **SQL Relacional**: Modelos normalizados (Empleados, Departamentos, Métricas de ventas) consumidos mediante Observables con joins de claves foráneas.
- **NoSQL Tiempo Real**: Colección documental <code>audit_logs</code> gestionada mediante un <code>BehaviorSubject</code> que emite telemetría y eventos en vivo sin recarga de navegador.`,
      badge: 'Fase 3 (RA 5)'
    },
    {
      id: 'dashboard-reports',
      category: 'Informes y Métricas',
      title: 'Cuadro de Mando Interactivo y Exportación PDF/CSV',
      summary: 'Visualización de gráficos dinámicos con Chart.js y generación de informes oficiales.',
      content: `El Cuadro de Mando Ejecutivo permite:
- Filtrar la facturación y los costes por departamento y rangos temporales en tiempo real.
- Exportar la información tabulada a formato **PDF** maquetado profesionalmente con cabecera corporativa y métricas resumen mediante <code>jspdf</code>.
- Descargar datos en formato **CSV** normalizado con codificación UTF-8 BOM.`,
      badge: 'Fase 3 (RA 5)'
    },
    {
      id: 'accessibility-wcag',
      category: 'Accesibilidad e Inclusión',
      title: 'Normativa WCAG 2.1 AA/AAA y Navegación Accesible',
      summary: 'Cumplimiento estricto de contrastes, WAI-ARIA, foco por teclado y auditoría Lighthouse.',
      content: `La aplicación garantiza máxima accesibilidad:
- Ratios de contraste superiores a 4.5:1 (texto normal) y 7:1 (alto contraste).
- Navegación íntegra por tabulación con indicador de foco visible (<code>:focus-visible</code>).
- Atributos semánticos WAI-ARIA (<code>role="region"</code>, <code>role="table"</code>, <code>aria-live="polite"</code>).
- Botón de salto rápido al contenido principal para lectores de pantalla.`,
      badge: 'Fase 4 (RA 4)'
    }
  ];

  selectTopic(id: string): void {
    this.selectedTopicId.set(id);
  }

  get currentTopic(): HelpTopic {
    return this.topics.find(t => t.id === this.selectedTopicId()) || this.topics[0];
  }
}
