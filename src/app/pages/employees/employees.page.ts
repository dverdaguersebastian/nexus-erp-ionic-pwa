import { Component, OnInit, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonMenuButton,
  IonSpinner,
  IonToast
} from '@ionic/angular';

import { SqlApiService } from '../../core/services/sql-api.service';
import { AuthService } from '../../core/services/auth.service';
import { ReportService } from '../../core/services/report.service';
import { NoSqlRealtimeService } from '../../core/services/nosql-realtime.service';
import { AdvancedDataTableComponent, TableColumn, TableAction } from '../../shared/components/advanced-data-table/advanced-data-table.component';
import { Employee, Department } from '../../core/models/relational.model';

/**
 * Página de Gestión de Personal y Plantilla de Empleados
 * Instancia el componente agnóstico AdvancedDataTableComponent y gestiona operaciones CRUD
 * con validación de roles y emisión de eventos de auditoría NoSQL.
 */
@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonMenuButton,
    IonSpinner,
    IonToast,
    AdvancedDataTableComponent
  ],
  templateUrl: './employees.page.html',
  styleUrls: ['./employees.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeesPage implements OnInit {
  private readonly sqlApi = inject(SqlApiService);
  public readonly authService = inject(AuthService);
  private readonly reportService = inject(ReportService);
  private readonly noSqlService = inject(NoSqlRealtimeService);

  public readonly employees = signal<Employee[]>([]);
  public readonly departments = signal<Department[]>([]);
  public readonly isLoading = signal<boolean>(true);
  public readonly toastMessage = signal<string | null>(null);

  // Definición de Columnas para el componente agnóstico
  public readonly columns: TableColumn<Employee>[] = [
    { key: 'code', label: 'Código', sortable: true },
    {
      key: 'fullName',
      label: 'Empleado',
      sortable: true,
      formatter: (_, row) => `${row.firstName} ${row.lastName}`
    },
    { key: 'email', label: 'Correo Electrónico' },
    { key: 'departmentName', label: 'Departamento', sortable: true },
    { key: 'position', label: 'Puesto' },
    { key: 'salary', label: 'Salario Anual', sortable: true, type: 'currency' },
    {
      key: 'status',
      label: 'Estado',
      sortable: true,
      type: 'badge',
      badgeColorMap: {
        ACTIVO: 'success',
        EN_VACACIONES: 'warning',
        BAJA_TEMPORAL: 'danger'
      }
    }
  ];

  // Acciones disponibles en la tabla
  public readonly actions: TableAction[] = [
    { id: 'view', label: 'Detalles', color: 'primary', ariaLabel: 'Ver detalles de empleado' },
    { id: 'delete', label: 'Baja', color: 'danger', ariaLabel: 'Dar de baja empleado' }
  ];

  ngOnInit(): void {
    this.loadEmployees();
    this.sqlApi.getDepartments().subscribe(d => this.departments.set(d));
  }

  loadEmployees(): void {
    this.isLoading.set(true);
    this.sqlApi.getEmployees().subscribe({
      next: (list) => {
        this.employees.set(list);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  onRowClick(emp: Employee): void {
    this.toastMessage.set(`Seleccionado empleado: ${emp.firstName} ${emp.lastName} (${emp.position})`);
  }

  onActionClick(event: { action: string; item: Employee }): void {
    const { action, item } = event;

    if (action === 'view') {
      this.toastMessage.set(`Ficha: ${item.firstName} ${item.lastName} - Dpto: ${item.departmentName} - Salario: €${item.salary}`);
    } else if (action === 'delete') {
      if (!this.authService.isAdmin()) {
        this.toastMessage.set('Acción denegada: Sólo el Administrador puede dar de baja a empleados.');
        this.noSqlService.logCustomEvent(
          'ACCESS_DENIED',
          'EMPLOYEE',
          `Intento no autorizado de borrado para ${item.code}`,
          'WARNING',
          this.authService.currentUser()?.id,
          this.authService.currentUser()?.name,
          'user'
        );
        return;
      }

      const confirmed = confirm(`¿Está seguro de dar de baja al empleado ${item.firstName} ${item.lastName}?`);
      if (confirmed) {
        this.sqlApi.deleteEmployee(item.id).subscribe(() => {
          this.toastMessage.set(`Empleado ${item.code} dado de baja del sistema.`);
          this.loadEmployees();
          this.noSqlService.logCustomEvent(
            'DELETE',
            'EMPLOYEE',
            `Baja de empleado ${item.code} (${item.firstName} ${item.lastName}) efectuada.`,
            'CRITICAL',
            this.authService.currentUser()?.id,
            this.authService.currentUser()?.name,
            'admin'
          );
        });
      }
    }
  }

  exportPdf(): void {
    this.reportService.exportEmployeesPdf(this.employees(), {
      title: 'NexusERP Pro - Listado Oficial de Personal',
      filename: `NexusERP_Empleados_${Date.now()}.pdf`
    });
  }

  exportCsv(): void {
    this.reportService.exportEmployeesCsv(this.employees(), 'NexusERP_Empleados.csv');
  }
}
