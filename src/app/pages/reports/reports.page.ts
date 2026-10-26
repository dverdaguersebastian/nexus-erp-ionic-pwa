import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonMenuButton,
  IonToast
} from '@ionic/angular';

import { ReportService } from '../../core/services/report.service';
import { SqlApiService } from '../../core/services/sql-api.service';
import { AuthService } from '../../core/services/auth.service';
import { NoSqlRealtimeService } from '../../core/services/nosql-realtime.service';

/**
 * Centro de Informes y Exportaciones Tabuladas
 * Genera informes profesionales en formato PDF y CSV estandarizados (RA 5).
 */
@Component({
  selector: 'app-reports',
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
    IonToast
  ],
  templateUrl: './reports.page.html',
  styleUrls: ['./reports.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportsPage {
  private readonly reportService = inject(ReportService);
  private readonly sqlApi = inject(SqlApiService);
  private readonly authService = inject(AuthService);
  private readonly noSqlService = inject(NoSqlRealtimeService);

  public readonly customTitle = signal<string>('NexusERP Pro - Informe Oficial');
  public readonly toastMessage = signal<string | null>(null);

  exportEmployeesPdf(): void {
    this.sqlApi.getEmployees().subscribe(emps => {
      this.reportService.exportEmployeesPdf(emps, {
        title: this.customTitle(),
        author: this.authService.currentUser()?.name || 'Administrador'
      });
      this.toastMessage.set('Informe PDF generado y descargado correctamente.');
      this.logAudit('EXPORT_REPORT', 'Generación de informe de empleados en formato PDF.');
    });
  }

  exportEmployeesCsv(): void {
    this.sqlApi.getEmployees().subscribe(emps => {
      this.reportService.exportEmployeesCsv(emps);
      this.toastMessage.set('Fichero CSV descargado correctamente.');
      this.logAudit('EXPORT_REPORT', 'Descarga de fichero CSV de plantilla de personal.');
    });
  }

  exportClientsCsv(): void {
    this.sqlApi.getClients().subscribe(clients => {
      this.reportService.exportClientsCsv(clients);
      this.toastMessage.set('Cartera CRM exportada a CSV con éxito.');
      this.logAudit('EXPORT_REPORT', 'Descarga de cartera comercial en formato CSV.');
    });
  }

  private logAudit(action: 'EXPORT_REPORT', description: string): void {
    const user = this.authService.currentUser();
    this.noSqlService.logCustomEvent(
      action,
      'FINANCE',
      description,
      'INFO',
      user?.id,
      user?.name,
      user?.role
    );
  }
}
