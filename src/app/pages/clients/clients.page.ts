import { Component, OnInit, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonMenuButton,
  IonSpinner
} from '@ionic/angular';

import { SqlApiService } from '../../core/services/sql-api.service';
import { ReportService } from '../../core/services/report.service';
import { AdvancedDataTableComponent, TableColumn } from '../../shared/components/advanced-data-table/advanced-data-table.component';
import { Client } from '../../core/models/relational.model';

/**
 * Página de Gestión de Clientes y CRM
 * Reutiliza el componente AdvancedDataTableComponent con un modelo de datos diferente
 * evidenciando su diseño agnóstico e independiente de la vista (RA 3).
 */
@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonMenuButton,
    IonSpinner,
    AdvancedDataTableComponent
  ],
  templateUrl: './clients.page.html',
  styleUrls: ['./clients.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientsPage implements OnInit {
  private readonly sqlApi = inject(SqlApiService);
  private readonly reportService = inject(ReportService);

  public readonly clients = signal<Client[]>([]);
  public readonly isLoading = signal<boolean>(true);

  public readonly columns: TableColumn<Client>[] = [
    { key: 'code', label: 'Código', sortable: true },
    { key: 'companyName', label: 'Empresa Cliente', sortable: true },
    { key: 'contactPerson', label: 'Persona de Contacto' },
    { key: 'email', label: 'Email Corporativo' },
    { key: 'city', label: 'Ciudad / Sede', sortable: true },
    { key: 'totalInvoiced', label: 'Facturado Acumulado', sortable: true, type: 'currency' },
    {
      key: 'status',
      label: 'Estado CRM',
      sortable: true,
      type: 'badge',
      badgeColorMap: {
        ACTIVO: 'success',
        POTENCIAL: 'warning',
        INACTIVO: 'medium'
      }
    }
  ];

  ngOnInit(): void {
    this.sqlApi.getClients().subscribe({
      next: (list) => {
        this.clients.set(list);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  exportCsv(): void {
    this.reportService.exportClientsCsv(this.clients(), 'NexusERP_Clientes_CRM.csv');
  }
}
